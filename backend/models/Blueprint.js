const mongoose = require('mongoose');

const blueprintSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a title'],
    trim: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  version: {
    type: String,
    default: '1.0'
  },
  imageUrl: {
    type: String,
    required: [true, 'Please upload the blueprint image']
  },
  status: {
    type: String,
    enum: ['Draft', 'Approved', 'Archived'],
    default: 'Draft'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blueprint', blueprintSchema);
