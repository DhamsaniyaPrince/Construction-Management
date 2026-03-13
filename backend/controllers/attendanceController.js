const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
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

// Mark attendance (upsert per worker/project/date)
const markAttendance = async (req, res) => {
  const { worker, project, date, status, checkIn, checkOut, notes } = req.body;

  if (!worker || !project || !date) {
    return res.status(400).json({ message: 'Worker, project, and date are required' });
  }
  if (!validateObjectId(worker) || !validateObjectId(project)) {
    return res.status(400).json({ message: 'Invalid worker or project ID' });
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
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('worker', 'name email role')
    .populate('project', 'name');

  return res.status(201).json({ message: 'Attendance recorded', attendance });
};

// Get attendance for a worker
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

  const { page, limit, skip } = getPagination(req.query);
  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter).populate('project', 'name').sort({ date: -1 }).skip(skip).limit(limit),
  ]);

  return res.status(200).json({ data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// Get attendance for a project/day
const getProjectAttendance = async (req, res) => {
  const { projectId } = req.params;
  const { date } = req.query;

  if (!validateObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const filter = { project: projectId };
  if (date) {
    filter.date = toDateOnly(date);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, records] = await Promise.all([
    Attendance.countDocuments(filter),
    Attendance.find(filter).populate('worker', 'name email role').sort({ date: -1 }).skip(skip).limit(limit),
  ]);

  return res.status(200).json({ data: records, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// Summary reports (counts by status)
const getAttendanceSummary = async (req, res) => {
  const { projectId } = req.params;
  const { date } = req.query;

  if (!validateObjectId(projectId)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const match = { project: new mongoose.Types.ObjectId(projectId) };
  if (date) {
    match.date = toDateOnly(date);
  }

  const summary = await Attendance.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  return res.status(200).json(summary);
};

module.exports = {
  markAttendance: asyncHandler(markAttendance),
  getWorkerAttendance: asyncHandler(getWorkerAttendance),
  getProjectAttendance: asyncHandler(getProjectAttendance),
  getAttendanceSummary: asyncHandler(getAttendanceSummary),
};
