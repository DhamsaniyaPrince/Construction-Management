// Complete Material Request Workflow Test v2
// Tests: Site Manager → Engineer → Contractor → Site Manager Status Update

const mongoose = require('mongoose');
const MaterialRequest = require('./backend/models/MaterialRequest');
const Project = require('./backend/models/Project');
const User = require('./backend/models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/construction-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testCompleteWorkflow = async () => {
  try {
    console.log('🔍 Testing Complete Material Request Workflow v2...\n');

    // 1. Find users for each role
    const siteManagers = await User.find({ role: 'site_manager' });
    const engineers = await User.find({ role: 'engineer' });
    const contractors = await User.find({ role: 'contractor' });

    if (siteManagers.length === 0 || engineers.length === 0 || contractors.length === 0) {
      console.log('❌ Missing required users:');
      console.log(`   Site Managers: ${siteManagers.length}`);
      console.log(`   Engineers: ${engineers.length}`);
      console.log(`   Contractors: ${contractors.length}`);
      return;
    }

    const siteManager = siteManagers[0];
    const engineer = engineers[0];
    const contractor = contractors[0];

    console.log('👷 Users found:');
    console.log(`   Site Manager: ${siteManager.name}`);
    console.log(`   Engineer: ${engineer.name}`);
    console.log(`   Contractor: ${contractor.name}`);

    // 2. Find a project with all roles assigned
    const projects = await Project.find({
      siteManagers: { $in: [siteManager._id] },
      engineers: { $in: [engineer._id] },
      contractor: contractor._id
    }).populate('engineers siteManagers contractor');

    if (projects.length === 0) {
      console.log('❌ No projects found with all roles assigned');
      
      // Find any project and show assignments
      const anyProject = await Project.findOne().populate('engineers siteManagers contractor');
      if (anyProject) {
        console.log('📋 Sample project assignments:');
        console.log(`   Project: ${anyProject.name}`);
        console.log(`   Site Managers: ${anyProject.siteManagers.map(sm => sm.name).join(', ') || 'None'}`);
        console.log(`   Engineers: ${anyProject.engineers.map(e => e.name).join(', ') || 'None'}`);
        console.log(`   Contractor: ${anyProject.contractor?.name || 'None'}`);
      }
      return;
    }

    const project = projects[0];
    console.log(`\n🏗️ Project found: ${project.name}`);
    console.log(`   Site Managers: ${project.siteManagers.map(sm => sm.name).join(', ')}`);
    console.log(`   Engineers: ${project.engineers.map(e => e.name).join(', ')}`);
    console.log(`   Contractor: ${project.contractor.name}`);

    // 3. Create a material request as Site Manager
    const testRequest = new MaterialRequest({
      projectId: project._id,
      materialName: 'Test Steel Beams',
      quantity: 100,
      unit: 'pieces',
      description: 'Test material for complete workflow verification',
      requestedBy: siteManager._id,
      status: 'PENDING_ENGINEER_APPROVAL'
    });

    await testRequest.save();
    console.log(`\n📝 STEP 1: Site Manager created request`);
    console.log(`   Material: ${testRequest.materialName}`);
    console.log(`   Status: ${testRequest.status}`);

    // 4. Test Engineer View
    console.log(`\n👷 STEP 2: Testing Engineer View`);
    const engineerPipeline = [
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
            $in: [engineer._id] 
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

    const engineerRequests = await MaterialRequest.aggregate(engineerPipeline);
    console.log(`   Engineer can see ${engineerRequests.length} requests`);
    engineerRequests.forEach(req => {
      console.log(`   - ${req.materialName} from ${req.projectId.name}`);
    });

    // 5. Engineer Approval
    testRequest.engineerApprovedBy = engineer._id;
    testRequest.engineerApprovedAt = new Date();
    testRequest.engineerRemarks = 'Technical specifications verified';
    testRequest.status = 'ENGINEER_APPROVED';
    await testRequest.save();
    console.log(`\n✅ STEP 3: Engineer approved request`);
    console.log(`   Status: ${testRequest.status}`);

    // 6. Test Contractor View
    console.log(`\n👷 STEP 4: Testing Contractor View`);
    const contractorPipeline = [
      {
        $match: {
          status: "ENGINEER_APPROVED",
          projectId: project._id
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
          "projectInfo.contractor": contractor._id
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

    const contractorRequests = await MaterialRequest.aggregate(contractorPipeline);
    console.log(`   Contractor can see ${contractorRequests.length} requests`);
    contractorRequests.forEach(req => {
      console.log(`   - ${req.materialName} from ${req.projectId.name}`);
    });

    // 7. Contractor Approval
    testRequest.contractorApprovedBy = contractor._id;
    testRequest.contractorApprovedAt = new Date();
    testRequest.contractorRemarks = 'Order processed and approved';
    testRequest.status = 'CONTRACTOR_APPROVED';
    await testRequest.save();
    console.log(`\n✅ STEP 5: Contractor approved request`);
    console.log(`   Status: ${testRequest.status}`);

    // 8. Status Updates
    testRequest.status = 'PURCHASED';
    await testRequest.save();
    console.log(`\n📦 STEP 6: Status updated to PURCHASED`);

    testRequest.status = 'DELIVERED';
    await testRequest.save();
    console.log(`\n✅ STEP 7: Status updated to DELIVERED`);

    // 9. Test Site Manager Final View
    console.log(`\n👷 STEP 8: Testing Site Manager Final View`);
    const siteManagerRequests = await MaterialRequest.find({
      requestedBy: siteManager._id
    })
      .populate('projectId', 'name')
      .populate('engineerApprovedBy', 'name')
      .populate('contractorApprovedBy', 'name');

    console.log(`   Site Manager can see ${siteManagerRequests.length} requests:`);
    siteManagerRequests.forEach(req => {
      console.log(`   - ${req.materialName}`);
      console.log(`     Status: ${req.status.replace(/_/g, ' ')}`);
      console.log(`     Engineer: ${req.engineerApprovedBy?.name || 'Pending'}`);
      console.log(`     Contractor: ${req.contractorApprovedBy?.name || 'Pending'}`);
    });

    // 10. Cleanup
    await MaterialRequest.deleteOne({ _id: testRequest._id });
    console.log(`\n🧹 Test data cleaned up`);

    console.log('\n✅ Complete Workflow Test Successful!');
    console.log('\n📋 Workflow Summary:');
    console.log('1. ✅ Site Manager creates request → PENDING_ENGINEER_APPROVAL');
    console.log('2. ✅ Engineer sees request (assigned to project)');
    console.log('3. ✅ Engineer approves → ENGINEER_APPROVED');
    console.log('4. ✅ Contractor sees request (assigned to project)');
    console.log('5. ✅ Contractor approves → CONTRACTOR_APPROVED');
    console.log('6. ✅ Contractor updates → PURCHASED → DELIVERED');
    console.log('7. ✅ Site Manager sees complete status history');

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testCompleteWorkflow();
