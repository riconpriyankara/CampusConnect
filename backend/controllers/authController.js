const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const path = require('path');

// Helper to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campusconnect_secret_key_2026_development', {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// Register user
// POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, department, year, bio } = req.body;

    // Check if email already registered
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Set profile picture if uploaded
    let profilePic = '';
    if (req.file) {
      profilePic = `/uploads/profiles/${req.file.filename}`;
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      department,
      year: parseInt(year),
      bio: bio || '',
      profilePic,
      activityTimeline: [
        {
          activityType: 'Account Creation',
          description: 'Created account and joined Campus Connect',
        },
      ],
    });

    if (user) {
      // Create initial notification
      await Notification.create({
        user: user._id,
        type: 'admin_alert',
        message: `Welcome to Campus Connect, ${user.name}! Start sharing notes and doubts.`,
      });

      res.status(201).json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
          year: user.year,
          profilePic: user.profilePic,
          bio: user.bio,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
// POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Add login to activity timeline
    user.activityTimeline.push({
      activityType: 'Login',
      description: 'Logged in to Campus Connect',
    });
    // Keep timeline limited to last 30 activities
    if (user.activityTimeline.length > 30) {
      user.activityTimeline.shift();
    }
    await user.save();

    res.json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        year: user.year,
        profilePic: user.profilePic,
        bio: user.bio,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get current user profile
// GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('bookmarkedNotes')
      .populate('bookmarkedEvents')
      .populate('savedBooks')
      .populate({
        path: 'recentlyViewedNotes.note',
        populate: { path: 'uploadedBy', select: 'name department' }
      });

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user profile
// PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.department = req.body.department || user.department;
      user.year = req.body.year ? parseInt(req.body.year) : user.year;
      user.bio = req.body.bio !== undefined ? req.body.bio : user.bio;

      if (req.file) {
        user.profilePic = `/uploads/profiles/${req.file.filename}`;
      }

      user.activityTimeline.push({
        activityType: 'Profile Update',
        description: 'Updated profile information',
      });

      const updatedUser = await user.save();

      res.json({
        success: true,
        user: {
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          department: updatedUser.department,
          year: updatedUser.year,
          profilePic: updatedUser.profilePic,
          bio: updatedUser.bio,
        },
      });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get notifications
// GET /api/auth/notifications
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);

    const unreadCount = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notifications as read
// PUT /api/auth/notifications/read
const markNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getNotifications,
  markNotificationsAsRead,
};
