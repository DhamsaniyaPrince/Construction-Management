const mongoose = require('mongoose');
const Project = require('../models/Project');
const MaterialRequest = require('../models/MaterialRequest');

// Get projects assigned to Site Manager
const getAssignedProjects = async (req, res) => {
  try {
    console.log('🔍 Site Manager Projects API:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   User email:', req.user.email);

    // Find projects where current user is assigned as site manager
    const projects = await Project.find({
      siteManagers: { $in: [req.user._id] }
    })
      .populate('engineers', 'name email')
      .populate('contractor', 'name email')
      .populate('siteManagers', 'name email')
      .sort({ createdAt: -1 });

    console.log('🔍 Query results:');
    console.log('   Assigned projects found:', projects.length);

    if (projects.length > 0) {
      console.log('   Sample project:', {
        name: projects[0].name,
        projectId: projects[0].projectId,
        engineersCount: projects[0].engineers?.length || 0,
        contractor: projects[0].contractor?.name || 'Not assigned'
      });
    }

    res.status(200).json({
      data: projects,
      count: projects.length,
    });
  } catch (error) {
    console.error('❌ Error fetching assigned projects:', error);
    res.status(500).json({ 
      message: "Failed to fetch assigned projects",
      error: error.message 
    });
  }
};

// Get material requests created by Site Manager
const getMyMaterialRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Site Manager Material Requests API:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   Status filter:', status);

    const filter = { requestedBy: req.user._id };
    if (status) filter.status = status;

    const materialRequests = await MaterialRequest.find(filter)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await MaterialRequest.countDocuments(filter);

    console.log('🔍 Query results:');
    console.log('   Material requests found:', materialRequests.length);
    console.log('   Total requests:', total);

    if (materialRequests.length > 0) {
      console.log('   Sample request:', {
        materialName: materialRequests[0].materialName,
        project: materialRequests[0].projectId?.name,
        status: materialRequests[0].status
      });
    }

    res.status(200).json({
      data: materialRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      }
    });
  } catch (error) {
    console.error('❌ Error fetching my material requests:', error);
    res.status(500).json({ 
      message: "Failed to fetch material requests",
      error: error.message 
    });
  }
};

// Create material request
const createMaterialRequest = async (req, res) => {
  try {
    console.log('🔍 Create Material Request API:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   Request body:', JSON.stringify(req.body, null, 2));

    const {
      projectId,
      materialName,
      quantity,
      unit,
      description
    } = req.body;

    // Validate required fields
    if (!projectId || !materialName || !quantity || !unit) {
      return res.status(400).json({
        message: "Missing required fields: projectId, materialName, quantity, unit"
      });
    }

    // Verify project exists and user is assigned
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ 
        message: "Project not found",
        projectId,
      });
    }

    console.log('🔍 Project found:', project.name);

    // Check if Site Manager is assigned to this project
    const isAssigned = project.siteManagers.some(
      (managerId) => managerId.toString() === req.user._id.toString()
    );

    if (!isAssigned) {
      console.log('❌ Site Manager NOT assigned to project');
      return res.status(403).json({
        message: "You can only create material requests for projects assigned to you",
        projectId,
        project: project.name,
      });
    }

    console.log('✅ Site Manager IS assigned to project');

    // Create material request
    const materialRequest = new MaterialRequest({
      projectId: new mongoose.Types.ObjectId(projectId),
      materialName: materialName.trim(),
      quantity: Number(quantity),
      unit,
      description: description || "",
      requestedBy: req.user._id,
      status: "PENDING_ENGINEER_APPROVAL",
    });

    await materialRequest.save();
    console.log('✅ Material request created:', materialRequest._id);

    // Populate request details
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
    ]);

    res.status(201).json({
      message: "Material request created successfully",
      materialRequest,
    });
  } catch (error) {
    console.error("❌ Error creating material request:", error);
    res.status(500).json({ 
      message: "Failed to create material request",
      error: error.message,
    });
  }
};

module.exports = {
  getAssignedProjects,
  getMyMaterialRequests,
  createMaterialRequest,
};
