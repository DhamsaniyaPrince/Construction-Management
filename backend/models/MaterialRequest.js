const mongoose = require('mongoose');

const materialRequestSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    materialType: { type: String, enum: ['raw_materials', 'equipment', 'tools', 'safety', 'electrical', 'plumbing', 'finishing'], required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['kg', 'tons', 'pieces', 'boxes', 'liters', 'meters', 'sqft'], required: true },
    urgency: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    siteManager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedContractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'approved', 'rejected', 'ordered', 'delivered', 'completed'], default: 'pending' },
    estimatedDelivery: { type: Date },
    actualDelivery: { type: Date },
    notes: { type: String, trim: true },
    budget: { type: Number },
    actualCost: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model('MaterialRequest', materialRequestSchema);