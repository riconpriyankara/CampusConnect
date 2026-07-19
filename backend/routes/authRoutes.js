const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getNotifications,
  markNotificationsAsRead,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/register', upload.single('profilePic'), registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, upload.single('profilePic'), updateUserProfile);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsAsRead);

module.exports = router;
