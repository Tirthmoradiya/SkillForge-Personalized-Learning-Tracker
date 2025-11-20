import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import LearningPath from '../models/LearningPath.js';

const router = express.Router();

// Register new user
// Added detailed error logging
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Enforce max 10 users
    const userCount = await User.countDocuments();
    if (userCount >= 10) {
      return res.status(400).json({ message: 'User limit reached. No more than 10 users allowed.' });
    }

    // If registering as admin, enforce max 2 admins
    if (role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount >= 2) {
        return res.status(400).json({ message: 'Admin limit reached. No more than 2 admins allowed.' });
      }
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const duplicateField = existingUser.email === email ? 'Email' : 'Username';
      return res.status(400).json({ message: `${duplicateField} already exists` });
    }

    const user = new User({ username, email, password, role });
    await user.save();

    // Send welcome notification
    const welcome = await Notification.create({
      user: user._id,
      message: 'Welcome to SkillForge! Start your learning journey now.',
      type: 'info',
    });
    user.notifications.push(welcome._id);
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        about: user.about,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      message: 'Registration failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        about: user.about,
        interests: user.interests,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Update lastLogin for user
router.post('/update-last-login', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.lastLogin = new Date();
    await user.save();
    res.json({ message: 'Last login updated' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Always return 200 with { user } JSON
    res.status(200).json({ user });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;