require('dotenv').config();   // 👈 MUST be first

const mongoose = require('mongoose');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);

    const adminExists = await User.findOne({ role: 'admin' }); 
    if (adminExists) {
      console.log('⚠️ Admin already exists');
      process.exit();
    }

    await User.create({
      name: 'Admin',
      email: 'admin@example.com',
       phone: '9999999999', 
      password: 'admin123',
      role: 'admin',
    });

    console.log('✅ Admin created successfully');
    process.exit();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();
