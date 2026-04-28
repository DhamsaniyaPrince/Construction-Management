require('dotenv').config();   // 👈 MUST be first

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ role: 'admin' }); 
    if (adminExists) {
      console.log('⚠️ Admin already exists:', adminExists.email);
      process.exit();
    }

    await User.create({
      name: 'System Admin',
      email: 'admin@gmail.com',
      phone: '+1234567890', 
      password: 'Admin@123', // Store plain password, schema will hash it
      role: 'admin',
      isVerified: true, // Admin accounts are automatically verified
    });

    console.log('✅ Admin created successfully');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@123');
    console.log('🔐 Please change the password after first login!');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
