const Invoice = require('../models/Invoice');

// @desc    Get invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    let query = {};

    // Contractor sees their own invoices
    if (req.user.role === 'contractor') {
      query.contractor = req.user._id;
    }
    // Site Manager / Admin see all
    
    const invoices = await Invoice.find(query)
      .populate('contractor', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Contractor)
const createInvoice = async (req, res) => {
  try {
    const { title, amount, description, imageUrl, projectId } = req.body;

    if (!title || !amount || !imageUrl) {
      return res.status(400).json({ message: 'Please provide title, amount, and image' });
    }

    const invoice = await Invoice.create({
      title,
      amount,
      description,
      imageUrl,
      project: projectId,
      contractor: req.user._id
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status
// @route   PUT /api/invoices/:id
// @access  Private (Site Manager/Admin)
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  createInvoice,
  updateInvoiceStatus
};
