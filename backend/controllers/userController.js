const User = require('../models/User');
const Task = require('../models/Task');
const { getPagination } = require('../utils/pagination');

// Get all users
const getUsers = async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const { page, limit, skip } = getPagination(req.query);
  const [total, users] = await Promise.all([
    User.countDocuments(filter),
    User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
  ]);

  return res.status(200).json({
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// Get worker analytics
const getWorkerAnalytics = async (req, res) => {
  try {
    // Get all workers
    const workers = await User.find({ role: 'worker' }).select('-password');
    
    // Get all tasks assigned to workers
    const tasks = await Task.find({ 
      assignedTo: { $in: workers.map(w => w._id) }
    }).populate('assignedTo', 'name specialization dailyWage');

    // Calculate analytics
    const totalWorkers = workers.length;
    const availableWorkers = workers.filter(w => w.isAvailable).length;
    const busyWorkers = totalWorkers - availableWorkers;

    // Task statistics
    const taskStats = {
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length,
      total: tasks.length
    };

    // Specialization distribution
    const specializationCount = {};
    workers.forEach(worker => {
      const spec = worker.specialization || 'General Labor';
      specializationCount[spec] = (specializationCount[spec] || 0) + 1;
    });

    // Wage distribution
    const wageRanges = {
      '0-50': 0,
      '51-100': 0,
      '101-150': 0,
      '151-200': 0,
      '200+': 0
    };

    workers.forEach(worker => {
      const wage = worker.dailyWage || 0;
      if (wage <= 50) wageRanges['0-50']++;
      else if (wage <= 100) wageRanges['51-100']++;
      else if (wage <= 150) wageRanges['101-150']++;
      else if (wage <= 200) wageRanges['151-200']++;
      else wageRanges['200+']++;
    });

    // Top performers (workers with most completed tasks)
    const workerPerformance = {};
    tasks.filter(t => t.status === 'Completed' || t.status === 'Verified')
        .forEach(task => {
          const workerId = task.assignedTo._id.toString();
          if (!workerPerformance[workerId]) {
            workerPerformance[workerId] = {
              name: task.assignedTo.name,
              completedTasks: 0,
              specialization: task.assignedTo.specialization
            };
          }
          workerPerformance[workerId].completedTasks++;
        });

    const topPerformers = Object.values(workerPerformance)
      .sort((a, b) => b.completedTasks - a.completedTasks)
      .slice(0, 5);

    // Attendance simulation (mock data for now)
    const attendanceRate = Math.floor(Math.random() * 15) + 85; // 85-99%

    const analytics = {
      overview: {
        totalWorkers,
        availableWorkers,
        busyWorkers,
        attendanceRate,
        totalTasks: taskStats.total,
        averageWage: workers.reduce((sum, w) => sum + (w.dailyWage || 0), 0) / totalWorkers || 0
      },
      taskStats,
      specializationDistribution: specializationCount,
      wageDistribution: wageRanges,
      topPerformers,
      recentTasks: tasks
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map(task => ({
          id: task._id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assignedTo: task.assignedTo.name,
          dueDate: task.dueDate,
          createdAt: task.createdAt
        }))
    };

    res.status(200).json(analytics);
  } catch (error) {
    console.error('Error fetching worker analytics:', error);
    res.status(500).json({ message: 'Failed to fetch worker analytics' });
  }
};

// Get individual worker analytics
const getWorkerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get worker details
    const worker = await User.findById(id).select('-password');
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Get all tasks for this worker
    const tasks = await Task.find({ assignedTo: id })
      .populate('project', 'name')
      .populate('assignedBy', 'name')
      .sort({ createdAt: -1 });

    // Calculate performance metrics
    const taskStats = {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'Pending').length,
      inProgress: tasks.filter(t => t.status === 'In Progress').length,
      completed: tasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length,
      overdue: tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'Completed' && t.status !== 'Verified'
      ).length
    };

    // Priority distribution
    const priorityStats = {
      low: tasks.filter(t => t.priority === 'Low').length,
      medium: tasks.filter(t => t.priority === 'Medium').length,
      high: tasks.filter(t => t.priority === 'High').length,
      urgent: tasks.filter(t => t.priority === 'Urgent').length
    };

    // Monthly performance (last 6 months)
    const monthlyData = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      
      const monthTasks = tasks.filter(t => {
        const taskDate = new Date(t.createdAt);
        return taskDate >= month && taskDate < nextMonth;
      });

      monthlyData.push({
        month: month.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: monthTasks.length,
        completed: monthTasks.filter(t => t.status === 'Completed' || t.status === 'Verified').length,
        pending: monthTasks.filter(t => t.status === 'Pending').length,
        inProgress: monthTasks.filter(t => t.status === 'In Progress').length
      });
    }

    // Project distribution
    const projectStats = {};
    tasks.forEach(task => {
      if (task.project) {
        const projectName = task.project.name || 'Unknown Project';
        projectStats[projectName] = (projectStats[projectName] || 0) + 1;
      }
    });

    // Completion rate
    const completionRate = taskStats.total > 0 ? (taskStats.completed / taskStats.total) * 100 : 0;

    // Average completion time (for completed tasks)
    const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Verified');
    let avgCompletionTime = 0;
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        if (task.updatedAt) {
          const completionTime = new Date(task.updatedAt) - new Date(task.createdAt);
          return sum + completionTime;
        }
        return sum;
      }, 0);
      avgCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // Convert to days
    }

    // Recent activity
    const recentTasks = tasks.slice(0, 10).map(task => ({
      id: task._id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: task.project?.name || 'No Project',
      assignedBy: task.assignedBy?.name || 'Unknown',
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      completedAt: task.updatedAt
    }));

    const workerAnalytics = {
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        specialization: worker.specialization,
        dailyWage: worker.dailyWage,
        isAvailable: worker.isAvailable,
        joinDate: worker.createdAt,
        lastLogin: worker.lastLogin
      },
      performance: {
        taskStats,
        priorityStats,
        completionRate: completionRate.toFixed(1),
        avgCompletionTime: avgCompletionTime.toFixed(1),
        totalEarnings: taskStats.completed * (worker.dailyWage || 0)
      },
      monthlyData,
      projectDistribution: projectStats,
      recentTasks
    };

    res.status(200).json(workerAnalytics);
  } catch (error) {
    console.error('Error fetching worker analytics:', error);
    res.status(500).json({ message: 'Failed to fetch worker analytics' });
  }
};

// Add worker by contractor
const addWorkerByContractor = async (req, res) => {
  try {
    const { name, email, phone, dailyWage, password } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !dailyWage) {
      return res.status(400).json({ message: 'Please provide name, email, phone, and daily wage' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Create worker with default password if not provided
    const workerPassword = password || 'worker123';

    const worker = await User.create({
      name,
      email,
      password: workerPassword,
      role: 'worker',
      phone,
      dailyWage: Number(dailyWage),
      specialization: 'General Labor' // Default specialization
    });

    res.status(201).json({
      message: 'Worker added successfully',
      worker: {
        id: worker._id,
        name: worker.name,
        email: worker.email,
        phone: worker.phone,
        dailyWage: worker.dailyWage,
        role: worker.role,
        isAvailable: worker.isAvailable
      }
    });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ message: 'Failed to add worker' });
  }
};

module.exports = { 
  getUsers, 
  getWorkerAnalytics,
  getWorkerById,
  addWorkerByContractor
};



