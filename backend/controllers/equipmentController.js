const mongoose = require('mongoose');
const Equipment = require('../models/Equipment');
const asyncHandler = require('../utils/asyncHandler');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Add equipment
const addEquipment = async (req, res) => {
  const { name, category, serialNumber, condition, status, notes, lastServiceDate } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Equipment name is required' });
  }

  const equipment = await Equipment.create({
    name,
    category,
    serialNumber,
    condition,
    status,
    notes,
    lastServiceDate,
    history: [
      {
        action: 'created',
        status: status || 'available',
        condition: condition || 'good',
        notes,
        changedBy: req.user?._id,
      },
    ],
  });

  return res.status(201).json({ message: 'Equipment added', equipment });
};

// Get all equipment (optional filters)
const getEquipmentList = async (req, res) => {
  const { status, project } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (project) {
    if (!validateObjectId(project)) {
      return res.status(400).json({ message: 'Invalid project ID' });
    }
    filter.assignedProject = project;
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, equipment] = await Promise.all([
    Equipment.countDocuments(filter),
    Equipment.find(filter).populate('assignedProject', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return res.status(200).json({ data: equipment, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

// Get single equipment
const getEquipment = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }

  const equipment = await Equipment.findById(id).populate('assignedProject', 'name');
  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }

  return res.status(200).json(equipment);
};

// Assign equipment to project
const assignEquipment = async (req, res) => {
  const { id } = req.params;
  const { project, notes } = req.body;

  if (!validateObjectId(id) || !validateObjectId(project)) {
    return res.status(400).json({ message: 'Invalid equipment or project ID' });
  }

  const equipment = await Equipment.findByIdAndUpdate(
    id,
    {
      assignedProject: project,
      status: 'in-use',
      $push: {
        history: {
          action: 'assigned',
          status: 'in-use',
          project,
          notes,
          changedBy: req.user?._id,
        },
      },
    },
    { new: true }
  ).populate('assignedProject', 'name');

  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }

  return res.status(200).json({ message: 'Equipment assigned', equipment });
};

// Update condition/status
const updateEquipmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status, condition, notes, lastServiceDate } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid equipment ID' });
  }

  const updates = {};
  if (status) updates.status = status;
  if (condition) updates.condition = condition;
  if (lastServiceDate) updates.lastServiceDate = lastServiceDate;
  if (Object.keys(updates).length === 0 && !notes) {
    return res.status(400).json({ message: 'Provide status, condition, or notes to update' });
  }

  const equipment = await Equipment.findByIdAndUpdate(
    id,
    {
      ...updates,
      $push: {
        history: {
          action: 'status-update',
          status,
          condition,
          notes,
          changedBy: req.user?._id,
        },
      },
    },
    { new: true, runValidators: true }
  );

  if (!equipment) {
    return res.status(404).json({ message: 'Equipment not found' });
  }

  return res.status(200).json({ message: 'Equipment updated', equipment });
};

module.exports = {
  addEquipment: asyncHandler(addEquipment),
  getEquipmentList: asyncHandler(getEquipmentList),
  getEquipment: asyncHandler(getEquipment),
  assignEquipment: asyncHandler(assignEquipment),
  updateEquipmentStatus: asyncHandler(updateEquipmentStatus),
};
