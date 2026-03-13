const Blueprint = require('../models/Blueprint');

// @desc    Get blueprints
// @route   GET /api/blueprints
// @access  Private
const getBlueprints = async (req, res) => {
  try {
    let query = {};
    if (req.query.projectId) {
      query.project = req.query.projectId;
    }

    const blueprints = await Blueprint.find(query)
      .populate('uploadedBy', 'name')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json(blueprints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload blueprint
// @route   POST /api/blueprints
// @access  Private (Engineer, Site Manager)
const uploadBlueprint = async (req, res) => {
  try {
    const { title, projectId, version, imageUrl, notes } = req.body;

    if (!title || !projectId || !imageUrl) {
      return res.status(400).json({ message: 'Please provide title, project, and image' });
    }

    const blueprint = await Blueprint.create({
      title,
      project: projectId,
      uploadedBy: req.user._id,
      version,
      imageUrl,
      notes,
      status: 'Approved' // Auto approve for now if uploaded by engineer
    });

    res.status(201).json(blueprint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBlueprints,
  uploadBlueprint
};
