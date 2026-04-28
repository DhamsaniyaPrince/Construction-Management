# MongoDB Database Cleanup for Attendance

## Run these commands in MongoDB shell or mongosh:

### 1. Delete broken attendance records with null values
```javascript
db.attendances.deleteMany({
  $or: [
    { worker: null },
    { workerId: null },  // Handle old field name if exists
    { project: null },
    { worker: { $exists: false } },
    { project: { $exists: false } }
  ]
});
```

### 2. Verify cleanup
```javascript
// Count remaining records
console.log("Remaining attendance records:", db.attendances.countDocuments());

// Check for any remaining null values
console.log("Records with null worker:", db.attendances.find({ worker: null }).countDocuments());
console.log("Records with null project:", db.attendances.find({ project: null }).countDocuments());
```

### 3. Check current indexes
```javascript
// Show current indexes
db.attendances.getIndexes();

// If needed, create correct unique index
db.attendances.createIndex({ worker: 1, date: 1 }, { unique: true });
```

### 4. Test attendance functionality
After cleanup, test marking attendance to ensure no duplicate key errors occur.
