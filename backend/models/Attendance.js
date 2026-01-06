const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ['present', 'absent', 'leave'], default: 'present' },
    checkIn: { type: Date },
    checkOut: { type: Date },
    notes: { type: String, trim: true },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

attendanceSchema.index({ worker: 1, project: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
