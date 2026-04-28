const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const roles = ['admin', 'engineer', 'contractor', 'site_manager', 'worker'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
  type: String,
  required: function () {
    return this.role !== "worker";
  },
  unique: true,
  sparse: true,
  lowercase: true,
  trim: true,
  default: undefined
},
    password: { type: String, minlength: 6, select: false },
    googleId: { type: String, unique: true, sparse: true },
    role: { 
      type: String, 
      enum: ['admin', 'engineer', 'contractor', 'site_manager', 'worker'], 
      default: 'worker',
      required: true
    },
    phone: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    
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
  console.log('🔐 Comparing passwords in User model...');
  console.log('Entered password:', enteredPassword);
  console.log('Stored hash starts with:', this.password.substring(0, 10) + '...');
  
  const result = await bcrypt.compare(enteredPassword, this.password);
  console.log('🔍 bcrypt.compare result:', result);
  
  return result;
};

module.exports = mongoose.model('User', userSchema);
