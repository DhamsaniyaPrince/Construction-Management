const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { sendEmail } = require('../utils/sendEmail');

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
    { expiresIn: '7d' }
  );

// Google OAuth login/signup
const googleAuth = async (req, res) => {
  const { token: googleToken, role } = req.body;

  if (!googleToken) {
    return res.status(400).json({ message: 'Google token is required' });
  }

  if (
    !process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID === 'your_google_client_id_here'
  ) {
    console.error('GOOGLE_CLIENT_ID is not configured in backend/.env');
    return res.status(500).json({
      message:
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID in backend/.env file.',
      details:
        process.env.NODE_ENV === 'development'
          ? 'Check SETUP_GOOGLE_OAUTH.md for setup instructions'
          : undefined,
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

    let user = await User.findOne({
      $or: [{ email }, { googleId }],
    });

    if (user) {
      // Reject worker login
      if (user.role === 'worker') {
        return res.status(403).json({
          message: 'Workers cannot login. Workers are managed by contractors.',
        });
      }

      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.name && name) user.name = name;
        await user.save();
      }
    } else {
      const allowedRoles = ['contractor', 'site_manager', 'engineer'];

      // Block admin account creation through public signup
      if (role === 'admin') {
        return res.status(403).json({
          message: 'Admin accounts cannot be created via public signup',
        });
      }

      if (role === 'worker') {
        return res.status(403).json({
          message:
            'Workers cannot create accounts. Workers are added by contractors.',
        });
      }

      const userRole =
        role && allowedRoles.includes(role) ? role : 'contractor';

      user = await User.create({
        name,
        email,
        googleId,
        role: userRole,
        isVerified: true, // Google users are automatically verified
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

    let errorMessage = 'Invalid Google token';
    let statusCode = 401;

    if (error.message && error.message.includes('invalid_client')) {
      errorMessage =
        'Invalid Google Client ID. Check GOOGLE_CLIENT_ID in backend/.env';
      statusCode = 500;
    } else if (error.message && error.message.includes('Token used too early')) {
      errorMessage = 'Token validation failed. Try again.';
    } else if (error.message && error.message.includes('Token used too late')) {
      errorMessage = 'Token expired. Try again.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return res.status(statusCode).json({
      message: errorMessage,
      details:
        process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// Public signup
const signupUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: 'Please provide name, email, and password' });
  }

  const allowedRoles = ['contractor', 'site_manager', 'engineer'];

  // Block admin account creation through public signup
  if (role === 'admin') {
    return res.status(403).json({
      message: 'Admin accounts cannot be created via public signup',
    });
  }

  if (role === 'worker') {
    return res.status(403).json({
      message:
        'Workers cannot create accounts. Workers are added by contractors.',
    });
  }

  const userRole =
    role && allowedRoles.includes(role) ? role : 'contractor';

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: 'User already exists' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    phone: phone || '',
  });

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationToken = verificationToken;
  await user.save();

  // Send verification email
  try {
    const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    
    // Development helper - log verification link
    console.log("🔗 Verification link:", verificationUrl);
    
    const html = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2 style="color: #333; text-align: center;">Welcome to ContractorHub</h2>
        <p style="color: #666; line-height: 1.6;">Hi ${name},</p>
        <p style="color: #666; line-height: 1.6;">Thank you for signing up! Please verify your email address to activate your account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #666; line-height: 1.6;">If the button above doesn't work, you can copy and paste this link into your browser:</p>
        <p style="color: #007bff; word-break: break-all;">${verificationUrl}</p>
        <p style="color: #666; line-height: 1.6;">This link will expire in 24 hours.</p>
        <p style="color: #666; line-height: 1.6;">Best regards,<br>ContractorHub Team</p>
      </div>
    `;

    await sendEmail(email, 'Verify Your Email - ContractorHub', html);
  } catch (emailError) {
    console.error('Error sending verification email:', emailError);
    // Continue with registration even if email fails
  }

  return res.status(201).json({
    message: 'User registered successfully. Please check your email to verify your account.',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      isVerified: user.isVerified,
    },
  });
};

// Admin only registration
const registerUser = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  if (!name || !email || !password || !phone) {
    return res.status(400).json({
      message: 'Please provide name, email, phone, and password',
    });
  }

  if (
    role &&
    !['admin', 'engineer', 'contractor', 'site_manager', 'worker'].includes(role)
  ) {
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
    return res
      .status(400)
      .json({ message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.log('❌ User not found:', email);
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  console.log('🔍 Found user:', { email: user.email, role: user.role, isVerified: user.isVerified });

  // Reject worker login
  if (user.role === 'worker') {
    return res.status(403).json({
      message: 'Workers cannot login. Workers are managed by contractors.',
    });
  }

  // Check email verification
  if (!user.isVerified) {
    console.log('❌ User not verified:', user.email);
    return res.status(403).json({
      message: 'Please verify your email before logging in',
    });
  }

  console.log('🔑 Comparing passwords...');
  console.log('Entered password:', password);
  console.log('Stored hash starts with:', user.password.substring(0, 10) + '...');

  const isMatch = await user.matchPassword(password);
  console.log('🔐 Password match result:', isMatch);

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

// Email verification
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return res.status(200).json({
      message: 'Email verified successfully. You can now login.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({ message: 'Email verification failed' });
  }
};

module.exports = {
  googleAuth: asyncHandler(googleAuth),
  signupUser: asyncHandler(signupUser),
  registerUser: asyncHandler(registerUser),
  loginUser: asyncHandler(loginUser),
  getCurrentUser: asyncHandler(getCurrentUser),
  verifyEmail: asyncHandler(verifyEmail),
};