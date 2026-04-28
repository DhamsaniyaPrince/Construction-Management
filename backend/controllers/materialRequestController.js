const mongoose = require("mongoose");
const MaterialRequest = require("../models/MaterialRequest");
const Project = require("../models/Project");
const User = require("../models/User");
const Material = require("../models/Material");
// Create material request (Site Manager only)
const createMaterialRequest = async (req, res) => {
  try {
    console.log("🔍 DEBUG - createMaterialRequest called by:", req.user.role, req.user._id);
    console.log("🔍 DEBUG - Request body:", JSON.stringify(req.body, null, 2));

    const {
      projectId,
      materialName,
      quantity,
      unit,
      description
    } = req.body;

    // Validate required fields with detailed error messages
    const missingFields = [];
    if (!projectId) missingFields.push("projectId");
    if (!materialName) missingFields.push("materialName");
    if (!quantity) missingFields.push("quantity");
    if (!unit) missingFields.push("unit");

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Missing required fields: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    // Validate field types
    if (typeof projectId !== "string" || !mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({
        message: "Invalid projectId format",
        field: "projectId",
        received: projectId,
      });
    }

    if (typeof materialName !== "string" || materialName.trim().length === 0) {
      return res.status(400).json({
        message: "materialName must be a non-empty string",
        field: "materialName",
        received: materialName,
      });
    }

    if (isNaN(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        message: "quantity must be a positive number",
        field: "quantity",
        received: quantity,
      });
    }

    // Verify project exists
    const projectDoc = await Project.findById(projectId);
    if (!projectDoc) {
      return res.status(404).json({ 
        message: "Project not found",
        projectId,
      });
    }

    console.log("🔍 DEBUG - Project found:", projectDoc.name);

    // 🔒 AUTHORIZATION: Check if Site Manager is assigned to this project
    if (req.user.role === "site_manager") {
      const isAssigned = projectDoc.siteManagers.some(
        (managerId) => managerId.toString() === req.user._id.toString()
      );

      if (!isAssigned) {
        console.log("🔍 DEBUG - Site Manager NOT assigned to project");
        return res.status(403).json({
          message: "You can only create material requests for projects assigned to you",
          projectId,
          project: projectDoc.name,
        });
      }

      console.log("🔍 DEBUG - Site Manager IS assigned to project");
    }

    // Create material request
    const materialRequest = new MaterialRequest({
      projectId: new mongoose.Types.ObjectId(projectId), // Ensure ObjectId
      materialName: materialName.trim(),
      quantity: Number(quantity),
      unit,
      description: description || "",
      requestedBy: req.user._id, // Use logged-in user ID
      status: "PENDING_ENGINEER_APPROVAL", // Correct status
    });

    await materialRequest.save();
    console.log("🔍 DEBUG - Material request saved:", materialRequest._id);

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
    console.error("🔍 DEBUG - Error creating material request:", error);
    
    // Handle specific errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        message: "Duplicate material request detected",
      });
    }

    res.status(500).json({ 
      message: "Failed to create material request",
      error: error.message,
    });
  }
};

// Engineer approval/rejection
const engineerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is in pending status
    if (materialRequest.status !== "PENDING_ENGINEER_APPROVAL") {
      return res.status(400).json({
        message: "Material request can only be approved/rejected when status is PENDING_ENGINEER_APPROVAL",
      });
    }

    // Update engineer approval
    materialRequest.engineerApprovedBy = req.user._id;
    materialRequest.engineerApprovedAt = new Date();
    materialRequest.engineerRemarks = comments || "";

    // Update status based on engineer decision
    materialRequest.status = approved ? "ENGINEER_APPROVED" : "ENGINEER_REJECTED";

    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "engineerApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Material request ${approved ? "approved" : "rejected"} by engineer`,
      materialRequest,
    });
  } catch (error) {
    console.error("Error in engineer approval:", error);
    res.status(500).json({ message: "Failed to process engineer approval" });
  }
};

// Contractor approval/rejection
const contractorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is approved by engineer
    if (materialRequest.status !== "ENGINEER_APPROVED") {
      return res.status(400).json({
        message: "Material request can only be approved/rejected by contractor after engineer approval",
      });
    }

    // Update contractor approval
    materialRequest.contractorApprovedBy = req.user._id;
    materialRequest.contractorApprovedAt = new Date();
    materialRequest.contractorRemarks = comments || "";

    // Update status based on contractor decision
    materialRequest.status = approved ? "CONTRACTOR_APPROVED" : "CONTRACTOR_REJECTED";

    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "engineerApprovedBy", select: "name email" },
      { path: "contractorApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Material request ${approved ? "approved" : "rejected"} by contractor`,
      materialRequest,
    });
  } catch (error) {
    console.error("Error in contractor approval:", error);
    res.status(500).json({ message: "Failed to process contractor approval" });
  }
};

// Get all material requests (Admin, Engineer, Contractor)
const getAllMaterialRequests = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // ✅ Declare FIRST
    let filter = {};

    console.log("🔍 Role:", req.user.role);

    if (req.user.role === "admin") {
      filter = {};
    }

    else if (req.user.role === "site_manager") {
      filter = { requestedBy: req.user._id };
    }

    else if (req.user.role === "engineer") {
      // Engineer will use dedicated aggregation endpoint
      // This fallback will only show basic requests without project filtering
      filter = {
        status: "PENDING_ENGINEER_APPROVAL"
      };
      
      console.log("🔍 Engineer basic filter - should use dedicated endpoint");
    }

    else if (req.user.role === "contractor") {
      // Get projects assigned to this contractor
      const assignedProjects = await Project.find({
        contractor: req.user._id
      }).select("_id");
      
      const projectIds = assignedProjects.map(p => p._id);
      
      filter = {
        status: "ENGINEER_APPROVED", // Use correct status from schema
        projectId: { $in: projectIds } // Only requests from assigned projects
      };
      
      console.log("🔍 Contractor filter:", {
        status: filter.status,
        projectCount: projectIds.length,
        projectIds: projectIds.slice(0, 3)
      });
    }

    // Override with query parameters if provided
    if (req.query.project) {
      filter.projectId = req.query.project;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    console.log("🔍 Filter:", filter);

    const total = await MaterialRequest.countDocuments(filter);

    const requests = await MaterialRequest.find(filter)
      .populate("projectId", "name")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log("🔍 Requests found:", requests.length);

    res.status(200).json({
      data: requests,
      pagination: {
        page,
        totalPages: Math.ceil(total / limit) || 1,
        total,
      },
    });
  } catch (error) {
    console.error(
      "Error fetching material requests:",
      error
    );

    res.status(500).json({
      message:
        error.message,
    });
  }
};

// Get material requests for a specific project
const getProjectMaterialRequests = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status } = req.query;

    // Verify project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Build filter
    const filter = { projectId };
    if (status) filter.status = status;

    const materialRequests = await MaterialRequest.find(filter)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      materialRequests,
      project: {
        id: project.id,
        name: project.name,
        projectId: project.projectId,
      },
      count: materialRequests.length,
    });
  } catch (error) {
    console.error("Error fetching project material requests:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch project material requests" });
  }
};

// Get material requests created by current user (Site Manager)
const getMyMaterialRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = { requestedBy: req.user._id };
    if (status) filter.status = status;

    const materialRequests = await MaterialRequest.find(filter)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      materialRequests,
      count: materialRequests.length,
    });
  } catch (error) {
    console.error("Error fetching my material requests:", error);
    res.status(500).json({ message: "Failed to fetch material requests" });
  }
};

// Get material requests for Engineer approval
const getEngineerMaterialRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log("🔍 Engineer Material Requests - User:", req.user._id, req.user.role);

    // Get projects assigned to this engineer
    const assignedProjects = await Project.find({
      engineers: { $in: [req.user._id] }
    }).select("_id name");

    const projectIds = assignedProjects.map(p => p._id);
    
    console.log("🔍 Engineer assigned projects:", {
      count: projectIds.length,
      projects: assignedProjects.map(p => p.name)
    });

    if (projectIds.length === 0) {
      return res.status(200).json({
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          totalPages: 0,
        },
        message: "No projects assigned to this engineer"
      });
    }

    // Build filter for pending requests
    const filter = {
      status: "PENDING_ENGINEER_APPROVAL", // Requests waiting for engineer approval
      projectId: { $in: projectIds }
    };

    if (status) filter.status = status;

    console.log("🔍 Engineer filter:", filter);

    // Use aggregation to ensure proper project filtering
    const aggregationPipeline = [
      {
        $match: {
          status: "PENDING_ENGINEER_APPROVAL",
          projectId: { $in: projectIds }
        }
      },
      {
        $lookup: {
          from: "projects",
          localField: "projectId",
          foreignField: "_id",
          as: "projectInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "requestedBy",
          foreignField: "_id",
          as: "requestedByInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "engineerApprovedBy",
          foreignField: "_id",
          as: "engineerApprovedByInfo"
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "contractorApprovedBy",
          foreignField: "_id",
          as: "contractorApprovedByInfo"
        }
      },
      {
        $unwind: "$projectInfo"
      },
      {
        $unwind: "$requestedByInfo"
      },
      {
        $addFields: {
          projectId: "$projectInfo",
          requestedBy: "$requestedByInfo",
          engineerApprovedBy: { $ifNull: ["$engineerApprovedByInfo", null] },
          contractorApprovedBy: { $ifNull: ["$contractorApprovedByInfo", null] }
        }
      },
      {
        $project: {
          materialName: 1,
          quantity: 1,
          unit: 1,
          description: 1,
          status: 1,
          requestDate: 1,
          engineerRemarks: 1,
          contractorRemarks: 1,
          engineerApprovedAt: 1,
          contractorApprovedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          projectId: {
            _id: "$projectInfo._id",
            name: "$projectInfo.name",
            projectId: "$projectInfo.projectId"
          },
          requestedBy: {
            _id: "$requestedByInfo._id",
            name: "$requestedByInfo.name",
            email: "$requestedByInfo.email"
          },
          engineerApprovedBy: {
            $cond: {
              if: { $ne: ["$engineerApprovedBy", []] },
              then: {
                _id: { $arrayElemAt: ["$engineerApprovedBy._id", 0] },
                name: { $arrayElemAt: ["$engineerApprovedBy.name", 0] },
                email: { $arrayElemAt: ["$engineerApprovedBy.email", 0] }
              },
              else: null
            }
          },
          contractorApprovedBy: {
            $cond: {
              if: { $ne: ["$contractorApprovedBy", []] },
              then: {
                _id: { $arrayElemAt: ["$contractorApprovedBy._id", 0] },
                name: { $arrayElemAt: ["$contractorApprovedBy.name", 0] },
                email: { $arrayElemAt: ["$contractorApprovedBy.email", 0] }
              },
              else: null
            }
          }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: parseInt(limit) }],
          totalCount: [{ $count: "count" }]
        }
      }
    ];

    const result = await MaterialRequest.aggregate(aggregationPipeline);
    const materialRequests = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    console.log("🔍 Engineer requests found:", materialRequests.length);

    res.status(200).json({
      data: materialRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
      assignedProjects: assignedProjects.map(p => ({ id: p._id, name: p.name }))
    });
  } catch (error) {
    console.error("🔍 Error fetching engineer material requests:", error);
    res.status(500).json({ 
      message: "Failed to fetch engineer material requests",
      error: error.message 
    });
  }
};

// Get material request by ID
const getMaterialRequestById = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id)
      .populate("projectId", "name projectId")
      .populate("requestedBy", "name email")
      .populate("engineerApprovedBy", "name email")
      .populate("contractorApprovedBy", "name email");

    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    res.status(200).json({
      materialRequest,
    });
  } catch (error) {
    console.error("Error fetching material request:", error);
    res.status(500).json({ message: "Failed to fetch material request" });
  }
};

// Legacy functions for backward compatibility
const getMaterialRequests = async (req, res) => {
  return getAllMaterialRequests(req, res);
};

const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // For backward compatibility, map old status to new workflow
    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    materialRequest.status = status;
    await materialRequest.save();

    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "technicalApprovedBy", select: "name email", model: "User" },
      {
        path: "finalApprovedBy",
        select: "name email",
        model: "User",
      },
    ]);

    res.status(200).json({
      message: "Material request updated successfully",
      materialRequest,
    });
  } catch (error) {
    console.error("Error updating material request:", error);
    res.status(500).json({ message: "Failed to update material request" });
  }
};

const getMaterialRequestsForContractor = async (req, res) => {
  try {
    const materialRequests = await MaterialRequest.find({
      status: { $in: ["engineer_approved", "approved", "rejected"] },
    })
      .populate([
        { path: "projectId", select: "name projectId" },
        { path: "requestedBy", select: "name email" },
        { path: "technicalApprovedBy", select: "name email", model: "User" },
        {
          path: "finalApprovedBy",
          select: "name email",
          model: "User",
        },
      ])
      .sort({ createdAt: -1 });

    res.status(200).json({
      data: materialRequests,
      pagination: {
        page: 1,
        limit: materialRequests.length,
        total: materialRequests.length,
        totalPages: 1,
      },
    });
  } catch (error) {
    console.error("Error fetching contractor material requests:", error);
    res.status(500).json({ message: "Failed to fetch material requests" });
  }
};

// Mark material as completed/issued
const completeMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Check if request is approved
    if (materialRequest.status !== "Approved") {
      return res.status(400).json({
        message:
          "Material can only be marked as completed when status is Approved",
      });
    }

    // Update status to completed
    materialRequest.status = "Completed";
    await materialRequest.save();

    // Populate response
    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "technicalApprovedBy", select: "name email" },
      { path: "finalApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: "Material marked as completed/issued",
      materialRequest,
    });
  } catch (error) {
    console.error("Error completing material:", error);
    res.status(500).json({ message: "Failed to complete material" });
  }
};

const deleteMaterialRequest = async (req, res) => {
  try {
    const materialRequest = await MaterialRequest.findById(req.params.id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    await MaterialRequest.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Material request deleted successfully" });
  } catch (error) {
    console.error("Error deleting material request:", error);
    res.status(500).json({ message: "Failed to delete material request" });
  }
};

module.exports = {
  createMaterialRequest,
  engineerApproval,
  contractorApproval,
  completeMaterial,
  getAllMaterialRequests,
  getProjectMaterialRequests,
  getMyMaterialRequests,
  getEngineerMaterialRequests,
  getMaterialRequestById,
  // Legacy functions
  getMaterialRequests,
  updateMaterialRequestStatus,
  getMaterialRequestsForContractor,
  deleteMaterialRequest,
};
