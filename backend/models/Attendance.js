const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    date: { type: Date, required: true },
    status: { 
      type: String, 
      enum: ['present', 'absent', 'half_day', 'leave', 'holiday'], 
      required: true,
      default: 'present'
    },
    checkIn: { type: String }, // Time in HH:MM format
    checkOut: { type: String }, // Time in HH:MM format
    workingHours: { type: Number }, // Calculated hours
    overtime: { type: Number, default: 0 }, // Overtime hours
    notes: { type: String, trim: true }, // Any notes for the day
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Who marked attendance
    contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Contractor context
    location: { type: String, trim: true }, // Work location for the day
    weather: { type: String, trim: true }, // Weather conditions
    isHoliday: { type: Boolean, default: false }, // If it's a holiday
    isWeekend: { type: Boolean, default: false }, // If it's a weekend
  },
  { timestamps: true }
);

attendanceSchema.index({ worker: 1, project: 1, date: 1 }, { unique: true });

// Pre-save middleware to calculate working hours
attendanceSchema.pre('save', function(next) {
  if (this.checkIn && this.checkOut) {
    const checkInTime = new Date(`2000-01-01T${this.checkIn}:00`);
    const checkOutTime = new Date(`2000-01-01T${this.checkOut}:00`);
    
    let hours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
    
    // Handle overnight work (negative hours)
    if (hours < 0) {
      hours += 24;
    }
    
    this.workingHours = Math.round(hours * 100) / 100; // Round to 2 decimal places
    
    // Calculate overtime (anything beyond 8 hours)
    if (this.workingHours > 8) {
      this.overtime = Math.round((this.workingHours - 8) * 100) / 100;
    }
  }
  next();
});

// Static method to get attendance statistics
attendanceSchema.statics.getAttendanceStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.startDate && filters.endDate) {
    matchStage.date = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  if (filters.project) {
    matchStage.project = new mongoose.Types.ObjectId(filters.project);
  }
  
  if (filters.contractor) {
    matchStage.contractor = new mongoose.Types.ObjectId(filters.contractor);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalHours: { $sum: '$workingHours' },
        totalOvertime: { $sum: '$overtime' }
      }
    }
  ]);

  const result = {
    present: 0,
    absent: 0,
    half_day: 0,
    leave: 0,
    holiday: 0,
    totalWorkers: 0,
    totalHours: 0,
    totalOvertime: 0,
    attendanceRate: 0
  };

  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.totalHours += stat.totalHours || 0;
    result.totalOvertime += stat.totalOvertime || 0;
    result.totalWorkers += stat.count;
  });

  // Calculate attendance rate (present + half_day) / total
  const productiveDays = result.present + (result.half_day * 0.5);
  result.attendanceRate = result.totalWorkers > 0 ? 
    Math.round((productiveDays / result.totalWorkers) * 100) : 0;

  return result;
};

// Static method to get daily strength for last week
attendanceSchema.statics.getDailyStrength = async function(projectId)  {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);

  const dailyData = await this.aggregate([
    {
      $match: {
        date: { $gte: startDate, $lte: endDate },
        status: { $in: ['present', 'half_day'] },
        ...(projectId && { project: new mongoose.Types.ObjectId(projectId) })
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
        present: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  return dailyData;
};

// Static method to get labor distribution
attendanceSchema.statics.getLaborDistribution = async function(filters = {})  {
  const matchStage = { status: 'present' };
  
  if (filters.project) {
    matchStage.project = new mongoose.Types.ObjectId(filters.project);
  }
  
  if (filters.date) {
    const targetDate = new Date(filters.date);
    matchStage.date = {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    };
  }

  const distribution = await this.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: 'users',
        localField: 'worker',
        foreignField: '_id',
        as: 'workerInfo'
      }
    },
    { $unwind: '$workerInfo' },
    {
      $group: {
        _id: '$workerInfo.role',
        count: { $sum: 1 }
      }
    }
  ]);

  return distribution;
};

module.exports = mongoose.model('Attendance', attendanceSchema);
