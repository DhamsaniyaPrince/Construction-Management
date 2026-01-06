const mongoose = require('mongoose');

const historySchema = new mongoose.Schema(
  {
    action: { type: String, required: true }, // created, assigned, status-update, condition-update
    status: { type: String },
    condition: { type: String },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    notes: { type: String, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const equipmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    serialNumber: { type: String, trim: true },
    condition: { type: String, enum: ['new', 'good', 'needs-repair', 'poor'], default: 'good' },
    status: { type: String, enum: ['available', 'in-use', 'maintenance', 'retired'], default: 'available' },
    assignedProject: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    lastServiceDate: { type: Date },
    notes: { type: String, trim: true },
    history: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Equipment', equipmentSchema);
