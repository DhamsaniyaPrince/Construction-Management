const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const toDateOnly = (value) => {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Mark attendance (upsert per worker/project/date) - Site Managers only
const markAttendance = async (req, res) => {
  // RBAC Check: Only Site Managers and Admins can mark attendance
  if (req.user.role !== 'site_manager' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Only Site Managers can mark attendance' });
  }

  const { worker, project, date, status, checkIn, checkOut, notes } = req.body;

  console.log("🔍 Attendance payload:", req.body);

  if (!worker || !project || !date) {
    return res.status(400).json({ message: 'Worker, project, and date are required' });
  }
  if (!validateObjectId(worker) || !validateObjectId(project)) {
    return res.status(400).json({ message: 'Invalid worker or project ID' });
  }

  // Validate status
  const validStatuses = ['present', 'absent', 'half_day', 'leave', 'holiday'];
  if (status && !validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }

  // Check if project exists and get contractor
  const projectData = await Project.findById(project).populate('contractor');
  if (!projectData) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const day = toDateOnly(date);
  const attendance = await Attendance.findOneAndUpdate(
    { worker, project, date: day },
    {
      worker,
      project,
      date: day,
      status: status || 'present',
      checkIn,
      checkOut,
      notes,
      recordedBy: req.user._id,
      contractor: projectData.contractor._id,
      isHoliday: status === 'holiday',
      isWeekend: new Date(date).getDay() === 0 || new Date(date).getDay() === 6
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('worker', 'name email role')
    .populate('project', 'name')
    .populate('contractor', 'name email');

  return res.status(201).json({ message: 'Attendance recorded', attendance });
};

// Get all attendance records
const getAllAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 50, project, date, startDate, endDate, status } = req.query;
    
    // Build filter
    const filter = {};
    
    // Project filter (with RBAC)
    if (project) {
      if (!validateObjectId(project)) {
        return res.status(400).json({ message: 'Invalid project ID' });
      }
      
      // RBAC Check: Contractors can only view their own projects
      if (req.user.role === 'contractor') {
        const contractorProject = await Project.findOne({ _id: project, contractor: req.user._id });
        if (!contractorProject) {
          return res.status(403).json({ message: 'Access denied - not your project' });
        }
      }
      
      filter.project = project;
    } else if (req.user.role === 'contractor') {
      // Contractors can only see their own projects
      const contractorProjects = await Project.find({ contractor: req.user._id }).select('_id');
      filter.project = { $in: contractorProjects.map(p => p._id) };
    }
    
    // Date filter
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // Status filter
    if (status) {
      filter.status = status;
    }
    
    const { page: pageNum, limit: limitNum, skip } = getPagination({ page, limit });
    
    const [total, records] = await Promise.all([
      Attendance.countDocuments(filter),
      Attendance.find(filter)
        .populate('worker', 'name email role')
        .populate('project', 'name')
        .populate('recordedBy', 'name email')
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum),
    ]);

    return res.status(200).json({ 
      data: records,
      pagination: { 
        page: pageNum, 
        limit: limitNum, 
        total, 
        pages: Math.ceil(total / limitNum) 
      } 
    });
  } catch (error) {
    console.error('Get all attendance error:', error);
    return res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
};

// Get attendance for a worker (View-only for Contractors)
const getWorkerAttendance = async (req, res) => {
  const { workerId } = req.params;
  const { from, to } = req.query;

  if (!validateObjectId(workerId)) {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }

  const filter = { worker: workerId };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = toDateOnly(from);
    if (to) filter.date.$lte = toDateOnly(to);
  }

  // Role-based filtering
  if (req.user.role === 'contractor') {
    // Contractors can only see attendance for their projects
    const contractorProjects = await Project.find({ contractor: req.user._id }).select('_id');
    const projectIds = contractorProjects.map(p => p._id.toString());
    
    // Get attendance records for this worker in contractor's projects
    const contractorAttendance = await Attendance.find({
      worker: workerId,
      project: { $in: projectIds }
    }).select('project');
    
    const allowedProjectIds = contractorAttendance.map(a => a.project.toString());
    filter.project = { $in: allowedProjectIds };
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate('project', 'name')
      .populate('contractor', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({ data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// Get attendance for a project/day (View-only for Contractors)
const getProjectAttendance = async (req, res) => {
  const { projectId } = req.params;
  const { date } = req.query;

  if (!validateObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  // RBAC Check: Contractors can only view their own projects
  if (req.user.role === 'contractor') {
    const contractorProject = await Project.findOne({ _id: projectId, contractor: req.user._id });
    if (!contractorProject) {
      return res.status(403).json({ message: 'Access denied - not your project' });
    }
  }

  const filter = { project: projectId };
  if (date) {
    filter.date = toDateOnly(date);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter)
      .populate('worker', 'name email role')
      .populate('recordedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({ data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// Summary reports (counts by status) - Enhanced with analytics
const getAttendanceSummary = async (req, res) => {
  const { projectId } = req.params;
  const { date, startDate, endDate } = req.query;

  if (!validateObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  // RBAC Check: Contractors can only view their own projects
  if (req.user.role === 'contractor') {
    const contractorProject = await Project.findOne({ _id: projectId, contractor: req.user._id });
    if (!contractorProject) {
      return res.status(403).json({ message: 'Access denied - not your project' });
    }
  }

  const match = { project: new mongoose.Types.ObjectId(projectId) };
  
  if (date) {
    match.date = toDateOnly(date);
  } else if (startDate && endDate) {
    match.date = {
      $gte: toDateOnly(startDate),
      $lte: toDateOnly(endDate)
    };
  }

  const summary = await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$workingHours' },
        totalOvertime: { $sum: '$overtime' }
      }
    },
  ]);

  // Calculate attendance rate
  const stats = await Attendance.getAttendanceStats({ 
    startDate: startDate || date, 
    endDate: endDate || date, 
    project: projectId 
  });

  return res.status(200).json({ 
    summary,
    stats
  });
};

// Get attendance statistics for dashboard
const getAttendanceStats = async (req, res) => {
  try {
    const { startDate, endDate, project } = req.query;

    // Role-based filtering
    const filters = { startDate, endDate, project };
    
    if (req.user.role === 'contractor') {
      // Contractors can only see stats for their projects
      const contractorProjects = await Project.find({ contractor: req.user._id }).select('_id');
      if (contractorProjects.length > 0) {
        filters.project = contractorProjects[0]._id;
      } else {
        return res.status(200).json({ message: 'No projects found', stats: {} });
      }
    }

    const stats = await Attendance.getAttendanceStats(filters);

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    res.status(500).json({ message: 'Failed to fetch attendance statistics' });
  }
};

// Get daily strength data for charts
const getDailyStrength = async (req, res) => {
  try {
    const { project } = req.query;

    // Role-based filtering
    let projectId = project;
    if (req.user.role === 'contractor') {
      const contractorProjects = await Project.find({ contractor: req.user._id }).select('_id');
      projectId = contractorProjects.length > 0 ? contractorProjects[0]._id : null;
    }

    const dailyData = await Attendance.getDailyStrength(projectId);

    res.status(200).json(dailyData);
  } catch (error) {
    console.error('Error fetching daily strength:', error);
    res.status(500).json({ message: 'Failed to fetch daily strength data' });
  }
};

// Get labor distribution for charts
const getLaborDistribution = async (req, res) => {
  try {
    const { project, date } = req.query;

    // Role-based filtering
    const filters = { project, date };
    
    if (req.user.role === 'contractor') {
      const contractorProjects = await Project.find({ contractor: req.user._id }).select('_id');
      filters.project = contractorProjects.length > 0 ? contractorProjects[0]._id : null;
    }

    const distribution = await Attendance.getLaborDistribution(filters);

    res.status(200).json(distribution);
  } catch (error) {
    console.error('Error fetching labor distribution:', error);
    res.status(500).json({ message: 'Failed to fetch labor distribution' });
  }
};

// Bulk mark attendance (Site Managers only)
const bulkMarkAttendance = async (req, res) => {
  try {
    // RBAC Check: Only Site Managers and Admins can bulk mark attendance
    if (req.user.role !== 'site_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only Site Managers can bulk mark attendance' });
    }

    const { date, project, attendanceRecords } = req.body;

    if (!date || !project || !attendanceRecords || !Array.isArray(attendanceRecords)) {
      return res.status(400).json({ message: 'Date, project, and attendance records array are required' });
    }

    // Check if project exists and get contractor
    const projectData = await Project.findById(project).populate('contractor');
    if (!projectData) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const results = [];
    const errors = [];

    for (const record of attendanceRecords) {
      try {
        const { worker, status, checkIn, checkOut, notes } = record;

        // Validate status
        const validStatuses = ['present', 'absent', 'half_day', 'leave', 'holiday'];
        if (!validStatuses.includes(status)) {
          errors.push({ worker, message: 'Invalid status' });
          continue;
        }

        const day = toDateOnly(date);

        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({ 
          worker, 
          project, 
          date: day 
        });

        if (existingAttendance) {
          errors.push({ worker, message: 'Attendance already marked' });
          continue;
        }

        // Create attendance record
        const attendance = await Attendance.create({
          worker,
          project,
          date: day,
          status,
          checkIn,
          checkOut,
          notes,
          recordedBy: req.user._id,
          contractor: projectData.contractor._id
        });

        await attendance.populate([
          { path: 'worker', select: 'name email role' },
          { path: 'project', select: 'name projectId' }
        ]);

        results.push(attendance);
      } catch (error) {
        errors.push({ worker: record.worker, message: error.message });
      }
    }

    res.status(201).json({
      message: `Successfully marked ${results.length} attendance records`,
      results,
      errors
    });
  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({ message: 'Failed to bulk mark attendance' });
  }
};

// Update attendance (Site Managers only)
const updateAttendance = async (req, res) => {
  try {
    // RBAC Check: Only Site Managers and Admins can update attendance
    if (req.user.role !== 'site_manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only Site Managers can update attendance' });
    }

    const { id } = req.params;
    const { status, checkIn, checkOut, notes } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ message: 'Invalid attendance ID' });
    }

    // Find attendance record
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Validate status if provided
    if (status) {
      const validStatuses = ['present', 'absent', 'half_day', 'leave', 'holiday'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      attendance.status = status;
      attendance.isHoliday = status === 'holiday';
    }

    // Update other fields
    if (checkIn) attendance.checkIn = checkIn;
    if (checkOut) attendance.checkOut = checkOut;
    if (notes) attendance.notes = notes;

    await attendance.save();

    await attendance.populate([
      { path: 'worker', select: 'name email role' },
      { path: 'project', select: 'name projectId' },
      { path: 'recordedBy', select: 'name email' }
    ]);

    res.status(200).json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    console.error('Error updating attendance:', error);
    res.status(500).json({ message: 'Failed to update attendance' });
  }
};

module.exports = {
  getAllAttendance: asyncHandler(getAllAttendance),
  markAttendance: asyncHandler(markAttendance),
  getWorkerAttendance: asyncHandler(getWorkerAttendance),
  getProjectAttendance: asyncHandler(getProjectAttendance),
  getAttendanceSummary: asyncHandler(getAttendanceSummary),
  getAttendanceStats: asyncHandler(getAttendanceStats),
  getDailyStrength: asyncHandler(getDailyStrength),
  getLaborDistribution: asyncHandler(getLaborDistribution),
  bulkMarkAttendance: asyncHandler(bulkMarkAttendance),
  updateAttendance: asyncHandler(updateAttendance),
};
