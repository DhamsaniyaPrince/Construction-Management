const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

// Google OAuth login/signup
const googleAuth = async (req, res) => {
  const { token: googleToken } = req.body;

  if (!googleToken) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  // Check if Google Client ID is configured
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here') {
    console.error('GOOGLE_CLIENT_ID is not configured in backend/.env');
    return res.status(500).json({ 
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in backend/.env file.',
      details: process.env.NODE_ENV === 'development' ? 'Check SETUP_GOOGLE_OAUTH.md for setup instructions' : undefined
    });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // Update user if they don't have googleId
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.name && name) user.name = name;
        await user.save();
      }
    } else {
      // Create new user
      user = await User.create({
        name,
        email,
        googleId,
        role: 'worker', // Default role
      });
    }

    const token = signToken(user);

    return res.status(200).json({
      message: 'Authentication successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    
    // Provide more helpful error messages
    let errorMessage = 'Invalid Google token';
    let statusCode = 401;
    
    if (error.message && error.message.includes('invalid_client')) {
      errorMessage = 'Invalid Google Client ID. Please check GOOGLE_CLIENT_ID in backend/.env matches your Google Cloud Console configuration.';
      statusCode = 500;
    } else if (error.message && error.message.includes('Token used too early')) {
      errorMessage = 'Token validation failed. Please try signing in again.';
    } else if (error.message && error.message.includes('Token used too late')) {
      errorMessage = 'Token has expired. Please try signing in again.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({ 
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Public signup
const signupUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please provide name, email, and password' });
  }

  // Only allow specific roles for public signup
  const allowedRoles = ['worker', 'contractor', 'engineer'];
  const userRole = role && allowedRoles.includes(role) ? role : 'worker';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({ 
    name, 
    email, 
    password, 
    role: userRole, 
    phone: phone || '' 
  });

  const token = signToken(user);

  return res.status(201).json({
    message: 'User registered successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

// Admin only registration
const registerUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({ message: 'Please provide name, email, phone, and password' });
  }

  if (role && !['admin', 'engineer', 'contractor', 'worker'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({ name, email, password, role, phone });

  return res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken(user);
  return res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

const getCurrentUser = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  return res.status(200).json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
    phone: req.user.phone,
  });
};

module.exports = {
  googleAuth: asyncHandler(googleAuth),
  signupUser: asyncHandler(signupUser),
  registerUser: asyncHandler(registerUser),
  loginUser: asyncHandler(loginUser),
  getCurrentUser: asyncHandler(getCurrentUser),
};