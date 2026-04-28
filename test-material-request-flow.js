// Test script to verify material request flow
// Run with: node test-material-request-flow.js

const mongoose = require('mongoose');
const MaterialRequest = require('./backend/models/MaterialRequest');
const Project = require('./backend/models/Project');
const User = require('./backend/models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/construction-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testFlow = async () => {
  try {
    console.log('🔍 Testing Material Request Flow...\n');

    // 1. Check if we have projects with engineers
    const projects = await Project.find({ engineers: { $exists: true, $ne: [] } })
      .populate('engineers', 'name email')
      .populate('siteManagers', 'name email');

    console.log('📋 Projects with assigned engineers:', projects.length);
    projects.forEach(project => {
      console.log(`  - ${project.name} (${project.projectId})`);
      console.log(`    Engineers: ${project.engineers.map(e => e.name).join(', ')}`);
      console.log(`    Site Managers: ${project.siteManagers.map(sm => sm.name).join(', ')}`);
    });

    // 2. Check material requests with PENDING_ENGINEER_APPROVAL status
    const pendingRequests = await MaterialRequest.find({ 
      status: 'PENDING_ENGINEER_APPROVAL' 
    })
      .populate('projectId', 'name projectId')
      .populate('requestedBy', 'name email');

    console.log('\n📝 Pending Material Requests:', pendingRequests.length);
    pendingRequests.forEach(request => {
      console.log(`  - ${request.materialName} (${request.quantity} ${request.unit})`);
      console.log(`    Project: ${request.projectId?.name} (${request.projectId?.projectId})`);
      console.log(`    Requested by: ${request.requestedBy?.name}`);
      console.log(`    Status: ${request.status}`);
    });

    // 3. Test aggregation for engineer
    if (projects.length > 0 && projects[0].engineers.length > 0) {
      const engineerId = projects[0].engineers[0]._id;
      console.log(`\n👷 Testing aggregation for Engineer: ${projects[0].engineers[0].name}`);

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
          $unwind: "$projectInfo"
        },
        {
          $unwind: "$requestedByInfo"
        },
        {
          $match: {
            "projectInfo.engineers": { 
              $in: [engineerId] 
            }
          }
        },
        {
          $project: {
            materialName: 1,
            quantity: 1,
            unit: 1,
            description: 1,
            status: 1,
            createdAt: 1,
            projectId: {
              _id: "$projectInfo._id",
              name: "$projectInfo.name",
              projectId: "$projectInfo.projectId"
            },
            requestedBy: {
              _id: "$requestedByInfo._id",
              name: "$requestedByInfo.name",
              email: "$requestedByInfo.email"
            }
          }
        }
      ];

      const result = await MaterialRequest.aggregate(aggregationPipeline);
      console.log(`🎯 Engineer should see ${result.length} requests:`);
      result.forEach(req => {
        console.log(`  - ${req.materialName} from ${req.projectId.name}`);
      });
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testFlow();
