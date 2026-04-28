const mongoose = require('mongoose');
const MaterialRequest = require('../models/MaterialRequest');
const Project = require('../models/Project');

// Get material requests for Engineer approval with aggregation
const getEngineerMaterialRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Engineer Material Requests API:');
    console.log('   User ID:', req.user._id);
    console.log('   User role:', req.user.role);
    console.log('   User email:', req.user.email);

    // Use aggregation to join material requests with projects and filter by assigned engineers
    const aggregationPipeline = [
      {
        $match: {
          status: "PENDING_ENGINEER_APPROVAL"
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
        $match: {
          "projectInfo.engineers": { 
            $in: [new mongoose.Types.ObjectId(req.user._id)] 
          }
        }
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

    // DEBUG: Check all pending requests first
    const allPendingRequests = await MaterialRequest.find({ 
      status: "PENDING_ENGINEER_APPROVAL" 
    });
    console.log('🔍 DEBUG - All pending requests:', allPendingRequests.length);

    // DEBUG: Check engineer's assigned projects
    const engineerProjects = await Project.find({
      engineers: { $in: [req.user._id] }
    });
    console.log('🔍 DEBUG - Engineer assigned projects:', engineerProjects.length);
    engineerProjects.forEach(project => {
      console.log(`   - ${project.name} (${project.projectId})`);
    });

    // DEBUG: Check if any pending requests match engineer's projects
    const matchingRequests = await MaterialRequest.find({
      status: "PENDING_ENGINEER_APPROVAL",
      projectId: { $in: engineerProjects.map(p => p._id) }
    }).populate('projectId', 'name projectId');
    
    console.log('🔍 DEBUG - Matching requests:', matchingRequests.length);
    matchingRequests.forEach(req => {
      console.log(`   - ${req.materialName} from ${req.projectId?.name}`);
    });

    console.log('🔍 Running aggregation pipeline...');
    const result = await MaterialRequest.aggregate(aggregationPipeline);
    const materialRequests = result[0].data;
    const total = result[0].totalCount[0]?.count || 0;

    console.log('🔍 Query results:');
    console.log('   Engineer requests found:', materialRequests.length);
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
    console.error('❌ Error fetching engineer material requests:', error);
    res.status(500).json({ 
      message: "Failed to fetch engineer material requests",
      error: error.message 
    });
  }
};

// Engineer approval/rejection
const engineerApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approved, comments } = req.body;

    console.log('🔍 Engineer Approval API:');
    console.log('   User ID:', req.user._id);
    console.log('   Request ID:', id);
    console.log('   Approved:', approved);

    if (typeof approved !== "boolean") {
      return res.status(400)
        .json({ message: "Approved field must be boolean" });
    }

    const materialRequest = await MaterialRequest.findById(id);
    if (!materialRequest) {
      return res.status(404).json({ message: "Material request not found" });
    }

    console.log('   Current status:', materialRequest.status);

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

    console.log('   Updated status:', materialRequest.status);

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
    console.error("❌ Error in engineer approval:", error);
    res.status(500).json({ message: "Failed to process engineer approval" });
  }
};

module.exports = {
  getEngineerMaterialRequests,
  engineerApproval,
};
