// Test script to verify project filtering logic
const mongoose = require('mongoose');

// Sample test data
const testUserId = new mongoose.Types.ObjectId();
const testProjectId = new mongoose.Types.ObjectId();

console.log('=== PROJECT FILTERING TEST ===');
console.log('Test User ID:', testUserId.toString());
console.log('Test Project ID:', testProjectId.toString());

// Test filter logic
const role = 'engineer';
let filter = {};

if (role === "admin") {
  filter = {};
}
else if (role === "contractor") {
  filter.contractor = testUserId;
}
else if (role === "engineer") {
  filter.engineers = { $in: [testUserId] };
}
else if (role === "site_manager") {
  filter.siteManagers = { $in: [testUserId] };
}

console.log('\n=== FILTER RESULTS ===');
console.log('Role:', role);
console.log('Filter:', JSON.stringify(filter, null, 2));

// Test sample project structure
const sampleProject = {
  _id: testProjectId,
  name: 'Test Project',
  contractor: testUserId,
  engineers: [testUserId],
  siteManagers: [testUserId],
  status: 'active'
};

console.log('\n=== SAMPLE PROJECT ===');
console.log('Project:', JSON.stringify(sampleProject, null, 2));

// Simulate MongoDB query matching
const wouldMatch = 
  (filter.contractor && filter.contractor.toString() === sampleProject.contractor.toString()) ||
  (filter.engineers && filter.engineers.$in && filter.engineers.$in.some(id => id.toString() === sampleProject.engineers[0].toString())) ||
  (filter.siteManagers && filter.siteManagers.$in && filter.siteManagers.$in.some(id => id.toString() === sampleProject.siteManagers[0].toString())) ||
  Object.keys(filter).length === 0; // admin

console.log('\n=== MATCH RESULT ===');
console.log('Would match:', wouldMatch);

console.log('\n=== TEST COMPLETED ===');
