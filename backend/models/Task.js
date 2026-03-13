const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a task title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  assignedTo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    // tasks might not always be linked to a big project immediately, but usually yes.
    // Making it optional for flexibility or required based on business rule.
    // Let's make it optional for now to avoid breaking if project ID is missing in simple flow.
  }, 
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Verified'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  siteLocation: {
    type: String,
    required: true
  },
  proofImages: [{
    type: String // URLs to uploaded images
  }],
  completionNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ project: 1 });

module.exports = mongoose.model('Task', taskSchema);
