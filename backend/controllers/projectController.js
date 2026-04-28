const mongoose = require('mongoose');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Create project
const createProject = async (req, res) => {
  console.log("User creating project:", req.user);
  console.log("Project payload:", req.body);

  if (!req.user) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const { 
    name, 
    description, 
    startDate, 
    endDate, 
    status, 
    budget, 
    engineers,
    siteManagers,
    contractor,
    projectId,
    projectType,
    location,
    contractorDetails,
    clientName,
    clientContact,
    estimatedDuration,
    priority,
    materials,
    teamSize,
    permits,
    insurance
  } = req.body;

  console.log("Extracted fields:", { name, description, location, startDate, endDate, status, budget });

  if (!name) {
    console.log("❌ Validation failed: Project name is required");
    return res.status(400).json({ message: 'Project name is required' });
  }

  if (engineers && !Array.isArray(engineers)) {
    console.log("❌ Validation failed: Engineers must be an array");
    return res.status(400).json({ message: 'Engineers must be an array of user IDs' });
  }

  // Location is optional in schema, so don't require it
  if (location && typeof location !== 'string') {
    console.log("❌ Validation failed: Location must be a string");
    return res.status(400).json({ message: 'Location must be a string' });
  }

  if (budget !== undefined && (isNaN(budget) || budget < 0)) {
    console.log("❌ Validation failed: Invalid budget value");
    return res.status(400).json({ message: 'Budget must be a valid positive number (₹)' });
  }

  // Generate unique projectId if not provided
  const uniqueProjectId = projectId || `PRJ-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  try {
    const project = await Project.create({
      projectId: uniqueProjectId,
      name,
      projectType,
      description,
      startDate,
      endDate,
      status: status || 'planning', // Default to planning if not provided
      priority: priority || 'medium', // Default to medium if not provided
      location,
      contractorDetails,
      budget,
      clientName,
      clientContact,
      estimatedDuration,
      materials,
      teamSize,
      permits,
      insurance,
      engineers: engineers || [],
      siteManagers: siteManagers || [],
      // Use contractor from request body if provided, otherwise assign based on user role
      contractor: contractor || (req.user.role === 'contractor' ? req.user._id : null)
    });

    console.log("Project created successfully:", project);
    return res.status(201).json({ message: 'Project created', project });
  } catch (error) {
    console.error("Project creation error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      keyPattern: error.keyPattern,
      keyValue: error.keyValue
    });
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.projectId) {
        return res.status(400).json({ message: 'Project ID already exists. Please try again.' });
      }
      if (error.keyPattern?.name && error.keyPattern?.contractor) {
        return res.status(409).json({ message: 'Project already exists for this contractor' });
      }
      return res.status(409).json({ message: 'Duplicate project detected.' });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.error("Validation errors:", errors);
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    
    return res.status(500).json({ message: 'Failed to create project', error: error.message });
  }
};

// Get projects assigned to current Site Manager
const getAssignedProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const userId = req.user._id || req.user.id;

    console.log("Site Manager requesting assigned projects:", req.user);
    console.log("Site Manager ID:", userId);

    let filter = { siteManagers: { $in: [userId] } };

    // Filter by status if provided
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    console.log("Mongo filter for assigned projects:", filter);

    const { page, limit, skip } = getPagination(req.query);
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate("contractor", "name email")
        .populate("engineers", "name email")
        .populate("siteManagers", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    console.log("🔍 Total assigned projects found:", total);
    console.log("🔍 Assigned projects returned:", projects.length);

    return res.status(200).json({
      data: projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error in getAssignedProjects:", error);
    return res.status(500).json({
      message: error.message
    });
  }
};

// Get all projects
const getProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const userId = req.user._id || req.user.id;
    const role = req.user.role;

    console.log("Logged user:", req.user);
    console.log("Resolved userId:", userId);
    console.log("Role:", role);

    let filter = {};

    // Filter by status if provided
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    // Role-based filtering
    if (role === "admin") {
      filter = {};
    }
    else if (role === "contractor") {
      filter.contractor = userId;
    }
    else if (role === "engineer") {
      filter.engineers = { $in: [userId] };
    }
    else if (role === "site_manager") {
      filter.siteManagers = { $in: [userId] };
    }

    console.log("Mongo filter:", filter);

    const { page, limit, skip } = getPagination(req.query);
    const [total, projects] = await Promise.all([
      Project.countDocuments(filter),
      Project.find(filter)
        .populate("contractor", "name email")
        .populate("engineers", "name email")
        .populate("siteManagers", "name email")
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),
    ]);

    console.log("🔍 Total projects found:", total);
    console.log("🔍 Projects returned:", projects.length);
    console.log("🔍 Project names:", projects.map(p => p.name));

    return res.status(200).json({
      data: projects,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error in getProjects:", error);
    return res.status(500).json({
      message: error.message
    });
  }
};

// Get single project
const getProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  const project = await Project.findById(id)
    .populate('engineers', 'name email role')
    .populate('contractor', 'name email role'); // Populate contractor info
    
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json(project);
};

// Update project
const updateProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  // Check if project exists and get its details
  const existingProject = await Project.findById(id);
  if (!existingProject) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Check if user has permission to update this project
  if (req.user.role === 'contractor' && existingProject.contractor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only update your own projects' });
  }

  const updates = req.body;
  const project = await Project.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
    .populate('engineers', 'name email role')
    .populate('contractor', 'name email role');

  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json({ message: 'Project updated', project });
};

// Delete project
const deleteProject = async (req, res) => {
  const { id } = req.params;
  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  // Check if project exists and get its details
  const existingProject = await Project.findById(id);
  if (!existingProject) {
    return res.status(404).json({ message: 'Project not found' });
  }

  // Check if user has permission to delete this project
  if (req.user.role === 'contractor' && existingProject.contractor.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'You can only delete your own projects' });
  }

  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  return res.status(200).json({ message: 'Project deleted' });
};

// Assign engineers
const assignEngineers = async (req, res) => {
  const { id } = req.params;
  const { engineers } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (!engineers || !Array.isArray(engineers)) {
    return res.status(400).json({ message: 'Engineers must be an array of user IDs' });
  }

  // First fetch the project to check ownership
  const project = await Project.findById(id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  console.log("User:", req.user);
  console.log("Project contractor:", project.contractor);

  // Check if contractor can only modify their own projects
  if (req.user.role === "contractor") {
    if (project.contractor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Contractors can only assign staff to their own projects"
      });
    }
  }

  const uniqueEngineers = [...new Set(engineers.filter(validateObjectId))];

  // Update the project with new engineers
  project.engineers = [...new Set([...project.engineers, ...uniqueEngineers])];
  await project.save();

  await project.populate('engineers', 'name email role');

  return res.status(200).json({ message: 'Engineers assigned', project });
};

// Assign site managers
const assignSiteManagers = async (req, res) => {
  const { id } = req.params;
  const { siteManagers } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (!siteManagers || !Array.isArray(siteManagers)) {
    return res.status(400).json({ message: 'Site managers must be an array of user IDs' });
  }

  // First fetch the project to check ownership
  const project = await Project.findById(id);
  
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  console.log("User:", req.user);
  console.log("Project contractor:", project.contractor);

  // Check if contractor can only modify their own projects
  if (req.user.role === "contractor") {
    if (project.contractor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Contractors can only assign staff to their own projects"
      });
    }
  }

  const uniqueSiteManagers = [...new Set(siteManagers.filter(validateObjectId))];

  // Update the project with new site managers
  project.siteManagers = [...new Set([...project.siteManagers, ...uniqueSiteManagers])];
  await project.save();

  await project.populate('siteManagers', 'name email role');

  return res.status(200).json({ message: 'Site managers assigned', project });
};

// Add milestone
const addMilestone = async (req, res) => {
  const { id } = req.params;
  const { title, dueDate, status, notes } = req.body;

  if (!validateObjectId(id)) {
    return res.status(400).json({ message: 'Invalid project ID' });
  }

  if (!title) {
    return res.status(400).json({ message: 'Milestone title is required' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  project.milestones.push({ title, dueDate, status, notes });
  await project.save();

  return res.status(201).json({ message: 'Milestone added', project });
};

// Update milestone
const updateMilestone = async (req, res) => {
  const { id, milestoneId } = req.params;
  const updates = req.body;

  if (!validateObjectId(id) || !validateObjectId(milestoneId)) {
    return res.status(400).json({ message: 'Invalid project or milestone ID' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: 'Milestone not found' });
  }

  Object.assign(milestone, updates);
  await project.save();

  return res.status(200).json({ message: 'Milestone updated', project });
};

// Remove milestone
const removeMilestone = async (req, res) => {
  const { id, milestoneId } = req.params;

  if (!validateObjectId(id) || !validateObjectId(milestoneId)) {
    return res.status(400).json({ message: 'Invalid project or milestone ID' });
  }

  const project = await Project.findById(id);
  if (!project) {
    return res.status(404).json({ message: 'Project not found' });
  }

  const milestone = project.milestones.id(milestoneId);
  if (!milestone) {
    return res.status(404).json({ message: 'Milestone not found' });
  }

  milestone.remove();
  await project.save();

  return res.status(200).json({ message: 'Milestone removed', project });
};

module.exports = {
  createProject: asyncHandler(createProject),
  getProjects: asyncHandler(getProjects),
  getAssignedProjects: asyncHandler(getAssignedProjects),
  getProject: asyncHandler(getProject),
  updateProject: asyncHandler(updateProject),
  deleteProject: asyncHandler(deleteProject),
  assignEngineers: asyncHandler(assignEngineers),
  assignSiteManagers: asyncHandler(assignSiteManagers),
  addMilestone: asyncHandler(addMilestone),
  updateMilestone: asyncHandler(updateMilestone),
  removeMilestone: asyncHandler(removeMilestone),
};
