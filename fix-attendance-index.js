// MongoDB script to fix attendance indexes
// Run this in MongoDB shell or mongosh

// Step 1: Delete the old stale index
try {
  db.attendances.dropIndex("workerId_1_date_1");
  console.log("✅ Successfully dropped old index: workerId_1_date_1");
} catch (error) {
  if (error.codeName === "IndexNotFound") {
    console.log("ℹ️ Old index not found, may have been already removed");
  } else {
    console.log("❌ Error dropping old index:", error);
  }
}

// Step 2: Check current indexes
console.log("\n📋 Current indexes on attendances collection:");
db.attendances.getIndexes().forEach(index => {
  console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
});

// Step 3: Ensure correct index exists
try {
  db.attendances.createIndex({ worker: 1, project: 1, date: 1 }, { unique: true });
  console.log("✅ Ensured correct index exists: { worker: 1, project: 1, date: 1 }");
} catch (error) {
  if (error.code === 11000) {
    console.log("ℹ️ Index already exists");
  } else {
    console.log("❌ Error creating index:", error);
  }
}

// Step 4: Verify final state
console.log("\n🎯 Final index state:");
db.attendances.getIndexes().forEach(index => {
  console.log(`- ${index.name}: ${JSON.stringify(index.key)} (unique: ${index.unique || false})`);
});

console.log("\n🚀 Attendance index fix completed!");
console.log("📝 Please restart the Node.js server to apply schema changes");
