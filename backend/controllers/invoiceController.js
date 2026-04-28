const Invoice = require('../models/Invoice');

// @desc    Get invoices
// @route   GET /api/invoices
// @access  Private
const getInvoices = async (req, res) => {
  try {
    console.log("Fetching invoices for user:", req.user.role, req.user._id);
    
    let invoices;

    if (req.user.role === "contractor") {
      invoices = await Invoice.find({ contractor: req.user._id })
        .populate("project", "name")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "admin") {
      invoices = await Invoice.find()
        .populate("project", "name")
        .populate("contractor", "name email")
        .sort({ createdAt: -1 });
    } else if (req.user.role === "site_manager" || req.user.role === "engineer") {
      // Site managers and engineers see invoices for their assigned projects
      // Get projects assigned to this user
      const Project = require('../models/Project');
      const assignedProjects = await Project.find({
        $or: [
          { engineers: req.user._id },
          { siteManagers: req.user._id }
        ]
      }).select('_id');
      
      const projectIds = assignedProjects.map(p => p._id);
      
      invoices = await Invoice.find({ project: { $in: projectIds } })
        .populate("project", "name")
        .populate("contractor", "name email")
        .sort({ createdAt: -1 });
    } else {
      // Workers have no access
      invoices = [];
    }

    console.log("Invoices found:", invoices.length);
    console.log("Sample invoice with project:", invoices[0]);
    console.log("Project populated correctly:", invoices[0]?.project?.name ? "YES" : "NO");

    res.json({
      data: invoices,
      pagination: {}
    });

  } catch (error) {
    console.error("Error fetching invoices:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private (Contractor)
const createInvoice = async (req, res) => {
  try {
    console.log("Incoming invoice payload:", req.body);
    console.log("Project field value:", req.body.project || req.body.projectId);
    console.log("User creating invoice:", req.user._id, req.user.name);
    const { title, amount, description, billImageUrl, imageUrl, projectId, project } = req.body;

    // Use billImageUrl or fallback to imageUrl for backward compatibility
    const finalBillImageUrl = billImageUrl || imageUrl;

    if (!title || !amount || !finalBillImageUrl) {
      return res.status(400).json({ message: 'Please provide title, amount, and bill image' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    const projectField = project || projectId;
    if (!projectField) {
      return res.status(400).json({ message: 'Project is required' });
    }

    console.log("🚀 Creating invoice with:", {
      title,
      amount,
      project: projectField,
      contractor: req.user._id,
      hasImage: !!finalBillImageUrl
    });

    const invoice = await Invoice.create({
      title,
      amount,
      description,
      billImageUrl: finalBillImageUrl,
      project: projectField,
      contractor: req.user._id,
      status: 'pending'
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Invoice creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject invoice
// @route   PUT /api/invoices/:id/approve
// @access  Private (Admin only)
const approveInvoice = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be approved or rejected' });
    }

    const invoice = await Invoice.findById(req.params.id)
      .populate('project', 'name')
      .populate('contractor', 'name email');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    console.log(`🚀 Invoice ${invoice._id} ${status} by admin ${req.user.name}`);

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Invoice approval error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice status (legacy)
// @route   PUT /api/invoices/:id
// @access  Private (Site Manager/Admin)
const updateInvoiceStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

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
  approveInvoice,
  updateInvoiceStatus
};
