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
  contractor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project'
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
    default: 'Pending'
  },
  description: {
    type: String
  },
  imageUrl: {
    type: String,
    required: [true, 'Please upload an image of the bill']
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Invoice', invoiceSchema);
