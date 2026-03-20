const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Set environment variables directly for now
process.env.MONGO_URI = 'mongodb://localhost:27017/construction-management';
process.env.JWT_SECRET = 'your-super-secret-jwt-key-change-this-in-production';
process.env.PORT = '5000';
process.env.GOOGLE_CLIENT_ID = '923806966722-uj02gd7u2quc1vqvocv72dft2s2oqlcj.apps.googleusercontent.com';
process.env.NODE_ENV = 'development';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Construction Management API running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/materials', require('./routes/materialRequestRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/equipment', require('./routes/equipmentRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/invoices', require('./routes/invoiceRoutes'));
app.use('/api/blueprints', require('./routes/blueprintRoutes'));

// 404 handler
app.use((req, res, next) => {
  res.status(404);
  next(new Error('Not Found'));
});

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

