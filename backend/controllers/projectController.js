const mongoose = require('mongoose');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Create project
const createProject = async (req, res) => {
  const { name, description, startDate, endDate, status, budget, engineers } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Project name is required' });
  }

  if (engineers && !Array.isArray(engineers)) {
    return res.status(400).json({ message: 'Engineers must be an array of user IDs' });
  }

  const project = await Project.create({
    name,
    description,
    startDate,
    endDate,
    status,
    budget,
    engineers,
  });

  return res.status(201).json({ message: 'Project created', project });
};

// Get all projects
const getProjects = async (req, res) => {
  const { status, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const { page, limit, skip } = getPagination(req.query);
  const [total, projects] = await Promise.all([
    Project.countDocuments(filter),
    Project.find(filter)
      .populate('engineers', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  return res.status(200).json({
    data: projects,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// Get single project
const getProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const project = await Project.findById(id).populate('engineers', 'name email role');
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json(project);
};

// Update project
const updateProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const updates = req.body;
  const project = await Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json({ message: 'Project updated', project });
};

// Delete project
const deleteProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json({ message: 'Project deleted' });
};

// Assign engineers
const assignEngineers = async (req, res) => {
  const { id } = req.params;
  const { engineers } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (!engineers || !Array.isArray(engineers)) {
    return res.status(400).json({ message: 'Engineers must be an array of user IDs' });
  }

  const uniqueEngineers = [...new Set(engineers.filter(validateObjectId))];

  const project = await Project.findByIdAndUpdate(
    id,
    { $addToSet: { engineers: { $each: uniqueEngineers } } },
    { new: true }
  ).populate('engineers', 'name email role');

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json({ message: 'Engineers assigned', project });
};

// Add milestone
const addMilestone = async (req, res) => {
  const { id } = req.params;
  const { title, dueDate, status, notes } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (!title) {
    return res.status(400).json({ message: 'Milestone title is required' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  project.milestones.push({ title, dueDate, status, notes });
  await project.save();

  return res.status(201).json({ message: 'Milestone added', project });
};

// Update milestone
const updateMilestone = async (req, res) => {
  const { id, milestoneId } = req.params;
  const updates = req.body;

  if (!validateObjectId(id) || !validateObjectId(milestoneId)) {
    return res.status(400).json({ message: 'Invalid project or milestone ID' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: 'Milestone not found' });
  }

  Object.assign(milestone, updates);
  await project.save();

  return res.status(200).json({ message: 'Milestone updated', project });
};

// Remove milestone
const removeMilestone = async (req, res) => {
  const { id, milestoneId } = req.params;

  if (!validateObjectId(id) || !validateObjectId(milestoneId)) {
    return res.status(400).json({ message: 'Invalid project or milestone ID' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: 'Milestone not found' });
  }

  milestone.remove();
  await project.save();

  return res.status(200).json({ message: 'Milestone removed', project });
};

module.exports = {
  createProject: asyncHandler(createProject),
  getProjects: asyncHandler(getProjects),
  getProject: asyncHandler(getProject),
  updateProject: asyncHandler(updateProject),
  deleteProject: asyncHandler(deleteProject),
  assignEngineers: asyncHandler(assignEngineers),
  addMilestone: asyncHandler(addMilestone),
  updateMilestone: asyncHandler(updateMilestone),
  removeMilestone: asyncHandler(removeMilestone),
};
