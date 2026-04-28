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
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Add contractor reference
    teamSize: { type: Number },
    permits: { type: String, trim: true },
    insurance: { type: String, trim: true },
    engineers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    siteManagers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    milestones: [milestoneSchema],
  },
  { timestamps: true }
);

// Add compound index to prevent duplicate projects by same contractor (only for non-null contractors)
projectSchema.index({ name: 1, contractor: 1 }, { 
  unique: true, 
  partialFilterExpression: { contractor: { $exists: true, $ne: null } }
});

module.exports = mongoose.model('Project', projectSchema);
