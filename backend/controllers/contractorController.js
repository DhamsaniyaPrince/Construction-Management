const mongoose = require('mongoose');
const MaterialRequest = require('../models/MaterialRequest');
const Project = require('../models/Project');

// Get material requests for Contractor approval
const getContractorMaterialRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Contractor Material Requests API:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   User email:', req.user.email);

    // Get projects assigned to this contractor
    const assignedProjects = await Project.find({
      contractor: req.user._id
    }).select('_id name projectId');

    console.log('🔍 Assigned projects:', assignedProjects.length);
    assignedProjects.forEach(project => {
      console.log(`   - ${project.name} (${project.projectId})`);
    });

    const projectIds = assignedProjects.map(p => p._id);

    // Use aggregation to join material requests with projects and filter by contractor assignment
    const aggregationPipeline = [
      {
        $match: {
          status: "ENGINEER_APPROVED",
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

    console.log('🔍 Running aggregation pipeline...');
    const result = await MaterialRequest.aggregate(aggregationPipeline);
    const materialRequests = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    console.log('🔍 Query results:');
    console.log('   Contractor requests found:', materialRequests.length);
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
    console.error('❌ Error fetching contractor material requests:', error);
    res.status(500).json({ 
      message: "Failed to fetch contractor material requests",
      error: error.message 
    });
  }
};

// Contractor approval/rejection
const contractorApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments, status } = req.body;

    console.log('🔍 Contractor Approval API:');
    console.log('   User ID:', req.user._id);
    console.log('   Request ID:', id);
    console.log('   Approved:', approved);
    console.log('   Status update:', status);

    if (typeof approved !== "boolean") {
      return res.status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    console.log('   Current status:', materialRequest.status);

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
    if (approved) {
      // If contractor approves, set to CONTRACTOR_APPROVED
      materialRequest.status = status || "CONTRACTOR_APPROVED";
    } else {
      // If contractor rejects, set to CONTRACTOR_REJECTED
      materialRequest.status = "CONTRACTOR_REJECTED";
    }

    await materialRequest.save();

    console.log('   Updated status:', materialRequest.status);

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
    console.error("❌ Error in contractor approval:", error);
    res.status(500).json({ message: "Failed to process contractor approval" });
  }
};

// Update material request status (for contractor to update to PURCHASED/DELIVERED)
const updateMaterialRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('🔍 Update Material Request Status API:');
    console.log('   User ID:', req.user._id);
    console.log('   Request ID:', id);
    console.log('   New status:', status);

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    // Verify contractor is assigned to this project
    const project = await Project.findById(materialRequest.projectId);
    if (!project || project.contractor?.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "You can only update status for projects assigned to you"
      });
    }

    // Validate status transitions
    const validStatuses = ["CONTRACTOR_APPROVED", "PURCHASED", "DELIVERED"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    materialRequest.status = status;
    await materialRequest.save();

    console.log('   Status updated successfully');

    await materialRequest.populate([
      { path: "projectId", select: "name projectId" },
      { path: "requestedBy", select: "name email" },
      { path: "contractorApprovedBy", select: "name email" },
    ]);

    res.status(200).json({
      message: `Material request status updated to ${status}`,
      materialRequest,
    });
  } catch (error) {
    console.error("❌ Error updating material request status:", error);
    res.status(500).json({ message: "Failed to update material request status" });
  }
};

module.exports = {
  getContractorMaterialRequests,
  contractorApproval,
  updateMaterialRequestStatus,
};
