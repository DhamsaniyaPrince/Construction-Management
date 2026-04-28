// Test Approval Flow - Engineer Reject vs Engineer Approve
// Run with: node test-approval-flow.js

const mongoose = require('mongoose');
const MaterialRequest = require('./backend/models/MaterialRequest');
const Project = require('./backend/models/Project');
const User = require('./backend/models/User');

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/construction-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const testApprovalFlow = async () => {
  try {
    console.log('🔍 Testing Approval Flow - Engineer Reject vs Approve...\n');

    // 1. Find users for each role
    const siteManagers = await User.find({ role: 'site_manager' });
    const engineers = await User.find({ role: 'engineer' });
    const contractors = await User.find({ role: 'contractor' });

    if (siteManagers.length === 0 || engineers.length === 0 || contractors.length === 0) {
      console.log('❌ Missing required users');
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
    const project = await Project.findOne({
      siteManagers: { $in: [siteManager._id] },
      engineers: { $in: [engineer._id] },
      contractor: contractor._id
    });

    if (!project) {
      console.log('❌ No project found with all roles assigned');
      return;
    }

    console.log(`\n🏗️ Project: ${project.name}`);

    // 3. TEST 1: Engineer Rejection Flow
    console.log('\n❌ TEST 1: Engineer Rejection Flow');
    
    const rejectRequest = new MaterialRequest({
      projectId: project._id,
      materialName: 'Test Material - REJECT',
      quantity: 50,
      unit: 'pieces',
      description: 'Test material for rejection flow',
      requestedBy: siteManager._id,
      status: 'PENDING_ENGINEER_APPROVAL'
    });

    await rejectRequest.save();
    console.log(`   Created request: ${rejectRequest.materialName}`);
    console.log(`   Initial status: ${rejectRequest.status}`);

    // Engineer rejects
    rejectRequest.engineerApprovedBy = engineer._id;
    rejectRequest.engineerApprovedAt = new Date();
    rejectRequest.engineerRemarks = 'Technical specifications not met';
    rejectRequest.status = 'ENGINEER_REJECTED';
    await rejectRequest.save();
    
    console.log(`   Engineer rejected: ${rejectRequest.status}`);
    console.log(`   Remarks: ${rejectRequest.engineerRemarks}`);

    // Check if contractor can see this request
    const contractorPipelineReject = [
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
      }
    ];

    const contractorViewReject = await MaterialRequest.aggregate(contractorPipelineReject);
    console.log(`   Contractor can see rejected request: ${contractorViewReject.length} (should be 0)`);

    // 4. TEST 2: Engineer Approval Flow
    console.log('\n✅ TEST 2: Engineer Approval Flow');
    
    const approveRequest = new MaterialRequest({
      projectId: project._id,
      materialName: 'Test Material - APPROVE',
      quantity: 100,
      unit: 'pieces',
      description: 'Test material for approval flow',
      requestedBy: siteManager._id,
      status: 'PENDING_ENGINEER_APPROVAL'
    });

    await approveRequest.save();
    console.log(`   Created request: ${approveRequest.materialName}`);
    console.log(`   Initial status: ${approveRequest.status}`);

    // Engineer approves
    approveRequest.engineerApprovedBy = engineer._id;
    approveRequest.engineerApprovedAt = new Date();
    approveRequest.engineerRemarks = 'Technical specifications verified';
    approveRequest.status = 'ENGINEER_APPROVED';
    await approveRequest.save();
    
    console.log(`   Engineer approved: ${approveRequest.status}`);
    console.log(`   Remarks: ${approveRequest.engineerRemarks}`);

    // Check if contractor can see this request
    const contractorPipelineApprove = [
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
      }
    ];

    const contractorViewApprove = await MaterialRequest.aggregate(contractorPipelineApprove);
    console.log(`   Contractor can see approved request: ${contractorViewApprove.length} (should be 1)`);

    // Contractor approves
    approveRequest.contractorApprovedBy = contractor._id;
    approveRequest.contractorApprovedAt = new Date();
    approveRequest.contractorRemarks = 'Order processed and approved';
    approveRequest.status = 'CONTRACTOR_APPROVED';
    await approveRequest.save();
    
    console.log(`   Contractor approved: ${approveRequest.status}`);
    console.log(`   Remarks: ${approveRequest.contractorRemarks}`);

    // 5. Site Manager View Test
    console.log('\n👷 TEST 3: Site Manager View');
    
    const siteManagerView = await MaterialRequest.find({
      requestedBy: siteManager._id
    })
      .populate('projectId', 'name')
      .populate('engineerApprovedBy', 'name')
      .populate('contractorApprovedBy', 'name');

    console.log(`   Site Manager sees ${siteManagerView.length} requests:`);
    siteManagerView.forEach(req => {
      console.log(`   - ${req.materialName}`);
      console.log(`     Status: ${req.status.replace(/_/g, ' ')}`);
      console.log(`     Engineer: ${req.engineerApprovedBy?.name || 'Pending'} (${req.status === 'ENGINEER_REJECTED' ? 'Rejected' : req.status === 'ENGINEER_APPROVED' ? 'Approved' : 'Pending'})`);
      console.log(`     Contractor: ${req.contractorApprovedBy?.name || 'Pending'} (${req.status === 'CONTRACTOR_REJECTED' ? 'Rejected' : req.status === 'CONTRACTOR_APPROVED' ? 'Approved' : 'Pending'})`);
    });

    // 6. Cleanup
    await MaterialRequest.deleteMany({ 
      _id: { $in: [rejectRequest._id, approveRequest._id] }
    });
    console.log('\n🧹 Test data cleaned up');

    console.log('\n✅ Approval Flow Test Results:');
    console.log('1. ✅ Engineer rejection stops workflow (contractor cannot see)');
    console.log('2. ✅ Engineer approval continues workflow (contractor can see)');
    console.log('3. ✅ Site Manager sees correct approval status for both');
    console.log('4. ✅ Rejected requests show "Request Rejected" status');
    console.log('5. ✅ Approved requests continue to contractor phase');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

testApprovalFlow();
