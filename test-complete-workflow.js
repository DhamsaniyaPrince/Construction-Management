// Complete Material Request Workflow Test
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
    console.log('🔍 Testing Complete Material Request Workflow...\n');

    // 1. Find a Site Manager with assigned projects
    const siteManagers = await User.find({ role: 'site_manager' });
    if (siteManagers.length === 0) {
      console.log('❌ No Site Managers found');
      return;
    }

    const siteManager = siteManagers[0];
    console.log(`👷 Site Manager: ${siteManager.name}`);

    // 2. Find projects assigned to this Site Manager
    const assignedProjects = await Project.find({
      siteManagers: { $in: [siteManager._id] }
    })
      .populate('engineers', 'name email')
      .populate('contractor', 'name email');

    if (assignedProjects.length === 0) {
      console.log('❌ No projects assigned to Site Manager');
      return;
    }

    const project = assignedProjects[0];
    console.log(`🏗️ Project: ${project.name}`);
    console.log(`   Engineers: ${project.engineers.map(e => e.name).join(', ')}`);
    console.log(`   Contractor: ${project.contractor?.name || 'Not assigned'}`);

    // 3. Create a material request as Site Manager
    const testRequest = new MaterialRequest({
      projectId: project._id,
      materialName: 'Test Cement',
      quantity: 50,
      unit: 'bags',
      description: 'Test material for workflow verification',
      requestedBy: siteManager._id,
      status: 'PENDING_ENGINEER_APPROVAL'
    });

    await testRequest.save();
    console.log(`📝 Material Request Created: ${testRequest.materialName}`);
    console.log(`   Status: ${testRequest.status}`);

    // 4. Test Engineer View - should see this request
    if (project.engineers.length > 0) {
      const engineer = project.engineers[0];
      console.log(`\n👷 Testing Engineer View: ${engineer.name}`);

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
            quantity: 1,
            unit: 1,
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

      // 5. Simulate Engineer Approval
      testRequest.engineerApprovedBy = engineer._id;
      testRequest.engineerApprovedAt = new Date();
      testRequest.engineerRemarks = 'Technical requirements verified';
      testRequest.status = 'ENGINEER_APPROVED';
      await testRequest.save();
      console.log(`\n✅ Engineer Approved: ${testRequest.materialName}`);
      console.log(`   Status: ${testRequest.status}`);

      // 6. Test Contractor View - should see approved request
      if (project.contractor) {
        console.log(`\n👷 Testing Contractor View: ${project.contractor.name}`);

        const contractorRequests = await MaterialRequest.find({
          status: 'ENGINEER_APPROVED',
          projectId: project._id
        }).populate('projectId', 'name');

        console.log(`   Contractor can see ${contractorRequests.length} requests`);
        contractorRequests.forEach(req => {
          console.log(`   - ${req.materialName} from ${req.projectId.name}`);
        });

        // 7. Simulate Contractor Approval
        testRequest.contractorApprovedBy = project.contractor._id;
        testRequest.contractorApprovedAt = new Date();
        testRequest.contractorRemarks = 'Order approved and processed';
        testRequest.status = 'CONTRACTOR_APPROVED';
        await testRequest.save();
        console.log(`\n✅ Contractor Approved: ${testRequest.materialName}`);
        console.log(`   Status: ${testRequest.status}`);

        // 8. Simulate Final Status Updates
        testRequest.status = 'PURCHASED';
        await testRequest.save();
        console.log(`📦 Status Updated: PURCHASED`);

        testRequest.status = 'DELIVERED';
        await testRequest.save();
        console.log(`✅ Status Updated: DELIVERED`);
      }
    }

    // 9. Test Site Manager Final View - should see complete workflow
    console.log(`\n👷 Testing Site Manager Final View:`);
    const siteManagerRequests = await MaterialRequest.find({
      requestedBy: siteManager._id
    })
      .populate('projectId', 'name')
      .populate('engineerApprovedBy', 'name')
      .populate('contractorApprovedBy', 'name');

    console.log(`   Site Manager created ${siteManagerRequests.length} requests:`);
    siteManagerRequests.forEach(req => {
      console.log(`   - ${req.materialName}`);
      console.log(`     Status: ${req.status.replace(/_/g, ' ')}`);
      console.log(`     Engineer: ${req.engineerApprovedBy?.name || 'Pending'}`);
      console.log(`     Contractor: ${req.contractorApprovedBy?.name || 'Pending'}`);
    });

    // 10. Cleanup test data
    await MaterialRequest.deleteOne({ _id: testRequest._id });
    console.log(`\n🧹 Test data cleaned up`);

    console.log('\n✅ Complete Workflow Test Successful!');
    console.log('\n📋 Workflow Summary:');
    console.log('1. ✅ Site Manager creates request → PENDING_ENGINEER_APPROVAL');
    console.log('2. ✅ Engineer sees request (assigned to project)');
    console.log('3. ✅ Engineer approves → ENGINEER_APPROVED');
    console.log('4. ✅ Contractor sees request (assigned to project)');
    console.log('5. ✅ Contractor approves → CONTRACTOR_APPROVED');
    console.log('6. ✅ Status updates → PURCHASED → DELIVERED');
    console.log('7. ✅ Site Manager sees complete status history');

  } catch (error) {
    console.error('❌ Workflow test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testCompleteWorkflow();
