const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an invoice title'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add an amount']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  billImageUrl: {
    type: String,
    required: [true, 'Please upload an image of the bill']
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
