const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    dueDate: { type: Date },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    notes: { type: String, trim: true },
  },
  { _id: true, timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
<<<<<<< HEAD
    projectId: { type: String, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    projectType: { type: String, enum: ['residential', 'commercial', 'industrial', 'infrastructure', 'renovation', 'maintenance'], trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    estimatedDuration: { type: String, trim: true },
    status: { type: String, enum: ['planning', 'active', 'on-hold', 'completed', 'cancelled'], default: 'planning' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    location: { type: String, trim: true },
    budget: { type: Number },
    materials: { type: Number },
    clientName: { type: String, trim: true },
    clientContact: { type: String, trim: true },
    contractorDetails: { type: String, trim: true },
    teamSize: { type: Number },
    permits: { type: String, trim: true },
    insurance: { type: String, trim: true },
=======
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    startDate: { type: Date },
    endDate: { type: Date },
    status: { type: String, enum: ['planned', 'active', 'on-hold', 'completed'], default: 'planned' },
    budget: { type: Number },
>>>>>>> bf98ea7563ee10ba16896f75a04cb46aad318a69
    engineers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    milestones: [milestoneSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
