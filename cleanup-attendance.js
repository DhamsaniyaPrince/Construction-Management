// MongoDB cleanup script for attendance records
// Run this in MongoDB shell or mongosh

// Delete attendance records with null worker or project
db.attendances.deleteMany({
  $or: [
    { worker: null },
    { project: null },
    { worker: { $exists: false } },
    { project: { $exists: false } }
  ]
});

// Verify cleanup
console.log("Remaining attendance records:");
db.attendances.countDocuments();

// Show any records with null values (should be 0)
console.log("Records with null worker:");
db.attendances.find({ worker: null }).countDocuments();

console.log("Records with null project:");
db.attendances.find({ project: null }).countDocuments();

console.log("Cleanup completed!");
