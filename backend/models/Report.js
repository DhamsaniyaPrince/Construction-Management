const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    filename: { type: String, required: true },
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true },
    progress: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    images: [imageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);
