const MaterialRequest = require('../models/MaterialRequest');
const Project = require('../models/Project');
const User = require('../models/User');

// Create material request
const createMaterialRequest = async (req, res) => {
  try {
    const { title, description, materialType, quantity, unit, urgency, project, estimatedDelivery, notes, budget } = req.body;

    // Validate required fields
    if (!title || !materialType || !quantity || !unit) {
      return res.status(400).json({ message: 'Title, material type, quantity, and unit are required' });
    }

    // Create material request
    const materialRequest = await MaterialRequest.create({
      title,
      description,
      materialType,
      quantity,
      unit,
      urgency,
      project,
      requestedBy: req.user.id,
      siteManager: req.user.id, // Site manager is the same person who requested
      estimatedDelivery,
      notes,
      budget
    });

    // Populate related data
    await materialRequest.populate([
      { path: 'project', select: 'name projectId' },
      { path: 'requestedBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Material request created successfully',
      materialRequest
    });
  } catch (error) {
    console.error('Error creating material request:', error);
    res.status(500).json({ message: 'Failed to create material request' });
  }
};

// Get all material requests
const getMaterialRequests = async (req, res) => {
  try {
    const { status, materialType, urgency } = req.query;
    const filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (materialType) filter.materialType = materialType;
    if (urgency) filter.urgency = urgency;

    const materialRequests = await MaterialRequest.find(filter)
      .populate([
        { path: 'project', select: 'name projectId' },
        { path: 'requestedBy', select: 'name email' },
        { path: 'assignedContractor', select: 'name email' },
        { path: 'siteManager', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: materialRequests,
      pagination: { page: 1, limit: materialRequests.length, total: materialRequests.length, totalPages: 1 }
    });
  } catch (error) {
    console.error('Error fetching material requests:', error);
    res.status(500).json({ message: 'Failed to fetch material requests' });
  }
};

// Get material request by ID
const getMaterialRequestById = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id)
      .populate([
        { path: 'project', select: 'name projectId' },
        { path: 'requestedBy', select: 'name email' },
        { path: 'assignedContractor', select: 'name email' },
        { path: 'siteManager', select: 'name email' }
      ]);

    if (!materialRequest) {
      return res.status(404).json({ message: 'Material request not found' });
    }

    res.status(200).json(materialRequest);
  } catch (error) {
    console.error('Error fetching material request:', error);
    res.status(500).json({ message: 'Failed to fetch material request' });
  }
};

// Update material request status
const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedContractor, actualCost, actualDelivery, notes } = req.body;

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'ordered', 'delivered', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: 'Material request not found' });
    }

    // Update fields
    materialRequest.status = status;
    if (assignedContractor) materialRequest.assignedContractor = assignedContractor;
    if (actualCost) materialRequest.actualCost = actualCost;
    if (actualDelivery) materialRequest.actualDelivery = actualDelivery;
    if (notes) materialRequest.notes = notes;

    await materialRequest.save();

    // Populate and return updated request
    await materialRequest.populate([
      { path: 'project', select: 'name projectId' },
      { path: 'requestedBy', select: 'name email' },
      { path: 'assignedContractor', select: 'name email' },
      { path: 'siteManager', select: 'name email' }
    ]);

    res.status(200).json({
      message: 'Material request updated successfully',
      materialRequest
    });
  } catch (error) {
    console.error('Error updating material request:', error);
    res.status(500).json({ message: 'Failed to update material request' });
  }
};

// Get material requests for contractors
const getMaterialRequestsForContractor = async (req, res) => {
  try {
    const materialRequests = await MaterialRequest.find({
      assignedContractor: req.user.id,
      status: { $in: ['approved', 'ordered', 'delivered'] }
    })
      .populate([
        { path: 'project', select: 'name projectId' },
        { path: 'requestedBy', select: 'name email' },
        { path: 'siteManager', select: 'name email' }
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: materialRequests,
      pagination: { page: 1, limit: materialRequests.length, total: materialRequests.length, totalPages: 1 }
    });
  } catch (error) {
    console.error('Error fetching contractor material requests:', error);
    res.status(500).json({ message: 'Failed to fetch material requests' });
  }
};

// Delete material request
const deleteMaterialRequest = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id);
    if (!materialRequest) {
      return res.status(404).json({ message: 'Material request not found' });
    }

    await MaterialRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Material request deleted successfully' });
  } catch (error) {
    console.error('Error deleting material request:', error);
    res.status(500).json({ message: 'Failed to delete material request' });
  }
};

module.exports = {
  createMaterialRequest,
  getMaterialRequests,
  getMaterialRequestById,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest
};
