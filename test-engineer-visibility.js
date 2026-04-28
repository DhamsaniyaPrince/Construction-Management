// Test Engineer Material Request Visibility
// Run with: node test-engineer-visibility.js

const mongoose = require('mongoose');
const MaterialRequest = require('./backend/models/MaterialRequest');
const Project = require('./backend/models/Project');
const User = require('./backend/models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/construction-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testEngineerVisibility = async () => {
  try {
    console.log('🔍 Testing Engineer Material Request Visibility...\n');

    // 1. Find all engineers
    const engineers = await User.find({ role: 'engineer' });
    if (engineers.length === 0) {
      console.log('❌ No engineers found in database');
      return;
    }

    console.log(`👷 Found ${engineers.length} engineers:`);
    engineers.forEach(engineer => {
      console.log(`   - ${engineer.name} (${engineer.email})`);
    });

    // 2. For each engineer, check their assigned projects and pending requests
    for (const engineer of engineers) {
      console.log(`\n🔍 Testing Engineer: ${engineer.name}`);
      
      // Get projects assigned to this engineer
      const assignedProjects = await Project.find({
        engineers: { $in: [engineer._id] }
      });
      
      console.log(`   Assigned projects: ${assignedProjects.length}`);
      assignedProjects.forEach(project => {
        console.log(`     - ${project.name} (${project.projectId})`);
      });

      // Check all pending requests
      const allPendingRequests = await MaterialRequest.find({ 
        status: 'PENDING_ENGINEER_APPROVAL' 
      }).populate('projectId', 'name');
      
      console.log(`   All pending requests: ${allPendingRequests.length}`);
      allPendingRequests.forEach(req => {
        console.log(`     - ${req.materialName} from ${req.projectId?.name}`);
      });

      // Check requests that should be visible to this engineer
      const visibleRequests = await MaterialRequest.find({
        status: 'PENDING_ENGINEER_APPROVAL',
        projectId: { $in: assignedProjects.map(p => p._id) }
      }).populate('projectId', 'name');
      
      console.log(`   Visible requests: ${visibleRequests.length}`);
      visibleRequests.forEach(req => {
        console.log(`     ✅ ${req.materialName} from ${req.projectId?.name}`);
      });

      // Test aggregation pipeline
      console.log(`   Testing aggregation pipeline...`);
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
          $unwind: "$projectInfo"
        },
        {
          $match: {
            "projectInfo.engineers": { 
              $in: [new mongoose.Types.ObjectId(engineer._id)] 
            }
          }
        },
        {
          $project: {
            materialName: 1,
            status: 1,
            projectId: {
              _id: "$projectInfo._id",
              name: "$projectInfo.name"
            }
          }
        }
      ];

      const aggregationResult = await MaterialRequest.aggregate(aggregationPipeline);
      console.log(`   Aggregation result: ${aggregationResult.length}`);
      aggregationResult.forEach(req => {
        console.log(`     ✅ ${req.materialName} from ${req.projectId.name}`);
      });
    }

    console.log('\n✅ Engineer visibility test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testEngineerVisibility();
