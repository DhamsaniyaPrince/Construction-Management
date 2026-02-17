const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let query = {};

    // If worker, only show Assigned To them
    if (req.user.role === 'worker') {
      query.assignedTo = req.user._id;
    }
    // If contractor, show tasks they assigned or tasks assigned to their workers (simplified to created by them for now)
    else if (req.user.role === 'contractor') {
      // Logic could be more complex, but for now:
      query.assignedBy = req.user._id;
    }
    // Admin/Manager/Engineer see all or specific project tasks
    // Keeping it simple: Admin/Manager see all.

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name role')
      .populate('project', 'title')
      .sort({ dueDate: 1 });

    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private (Contractor, Site Manager, Engineer, Admin)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate, siteLocation } = req.body;

    if (!title || !description || !assignedTo) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      priority,
      dueDate,
      siteLocation,
      status: 'Pending'
    });

    // Send notification to assigned worker
    await createNotification(
      assignedTo,
      req.user._id,
      'task_assigned',
      'New Task Assigned',
      `You have been assigned a new task: ${title}`,
      task._id,
      priority || 'medium'
    );

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Authorization check
    // Worker can only update Status to In Progress -> Completed
    // Creator can update anything
    
    if (req.user.role === 'worker' && task.assignedTo.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    // If it's the worker, they can technically only update status and add proof images
    // For simplicity, we allow updating body fields passed
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );

    res.status(200).json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask
};
