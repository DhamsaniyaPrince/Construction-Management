const mongoose = require('mongoose');
const Report = require('../models/Report');
const Project = require('../models/Project');
const { saveFile } = require('../utils/fileStorage');
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

// Create report with images
const createReport = async (req, res) => {
  const { project, text, progress, date } = req.body;

  if (!project || !text) {
    return res.status(400).json({ message: 'Project and text are required' });
  }

  if (!validateObjectId(project)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  // Validate project assignment for Site Managers
  if (req.user.role === 'site_manager') {
    try {
      const assignedProject = await Project.findOne({
        _id: project,
        siteManagers: { $in: [req.user._id] }
      });

      if (!assignedProject) {
        console.log(`Site Manager ${req.user._id} trying to submit report for unassigned project ${project}`);
        return res.status(403).json({ 
          message: 'You can only submit reports for projects assigned to you' 
        });
      }
    } catch (error) {
      console.error('Error validating project assignment:', error);
      return res.status(500).json({ message: 'Error validating project assignment' });
    }
  }

  let uploadedImages = [];
  if (req.files && req.files.length > 0) {
    try {
      uploadedImages = await Promise.all(
        req.files.map(async (file) => {
          const result = await saveFile(file, 'reports');
          return { url: result.url, filename: result.filename };
        })
      );
    } catch (error) {
      return res.status(500).json({ message: 'Image upload failed', error: error.message });
    }
  }

  const report = await Report.create({
    project,
    createdBy: req.user._id,
    text,
    progress,
    date: date ? new Date(date) : Date.now(),
    images: uploadedImages,
  });

  return res.status(201).json({ message: 'Report created', report });
};

// List reports (filter by project or date)
const listReports = async (req, res) => {
  const { project, date } = req.query;
  const filter = {};

  if (project) {
    if (!validateObjectId(project)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    filter.project = project;
  }

  if (date) {
    filter.date = toDateOnly(date);
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, reports] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .populate('createdBy', 'name email role')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return res.status(200).json({
    data: reports,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

module.exports = { createReport: asyncHandler(createReport), listReports: asyncHandler(listReports) };
