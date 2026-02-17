const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const roles = ['admin', 'engineer', 'contractor', 'site_manager', 'worker'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, minlength: 6, select: false },
    googleId: { type: String, unique: true, sparse: true },
    role: { 
      type: String, 
      enum: ['admin', 'engineer', 'contractor', 'site_manager', 'worker'], 
      default: 'worker',
      required: true
    },
    phone: { type: String, trim: true },
    
    // Worker Specific Fields
    dailyWage: { type: Number, default: 0 },
    specialization: { type: String, default: 'General Labor' },
    isAvailable: { type: Boolean, default: true },
    
    // Meta
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
