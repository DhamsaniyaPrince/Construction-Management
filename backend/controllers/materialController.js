const mongoose = require('mongoose');
const Material = require('../models/Material');
const asyncHandler = require('../utils/asyncHandler');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Request material
const requestMaterial = async (req, res) => {
  const { project, name, quantity, unit, notes } = req.body;

  if (!project || !name || !quantity) {
    return res.status(400).json({ message: 'Project, name, and quantity are required' });
  }

  if (!validateObjectId(project)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const material = await Material.create({
    project,
    requestedBy: req.user._id,
    name,
    quantity,
    unit,
    notes,
  });

  return res.status(201).json({ message: 'Material requested', material });
};

// Approve / Reject material
const reviewMaterial = async (req, res) => {
  const { id } = req.params;
  const { action, notes } = req.body; // action: approve | reject

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid material ID' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ message: 'Action must be approve or reject' });
  }

  const status = action === 'approve' ? 'approved' : 'rejected';

  const material = await Material.findByIdAndUpdate(
    id,
    { status, approvedBy: req.user._id, approvedAt: new Date(), notes },
    { new: true }
  ).populate('requestedBy', 'name email');

  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  return res.status(200).json({ message: `Material ${status}`, material });
};

// View materials (optionally by project)
const getMaterials = async (req, res) => {
  const { project, status } = req.query;
  const filter = {};

  if (project) {
    if (!validateObjectId(project)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    filter.project = project;
  }
  if (status) {
    filter.status = status;
  }

  const { page, limit, skip } = getPagination(req.query);

  const [total, materials] = await Promise.all([
    Material.countDocuments(filter),
    Material.find(filter)
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  return res.status(200).json({
    data: materials,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
};

// Update status
const updateMaterialStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid material ID' });
  }

  const allowedStatuses = ['pending', 'approved', 'rejected', 'ordered', 'delivered'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const material = await Material.findByIdAndUpdate(id, { status }, { new: true });
  if (!material) {
    return res.status(404).json({ message: 'Material not found' });
  }

  return res.status(200).json({ message: 'Status updated', material });
};

module.exports = {
  requestMaterial: asyncHandler(requestMaterial),
  reviewMaterial: asyncHandler(reviewMaterial),
  getMaterials: asyncHandler(getMaterials),
  updateMaterialStatus: asyncHandler(updateMaterialStatus),
};
