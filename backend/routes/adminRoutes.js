const express = require('express');
const router = express.Router();
const {
  getStats,
  getReports,
  fileReport,
  resolveReport,
  deleteReportedContent,
  getUsers,
  deleteUser,
} = require('../controllers/adminController');
const { protect, admin } = require('../middleware/auth');

// Stats, reports moderation and user listings are admin only
router.get('/stats', protect, admin, getStats);
router.get('/reports', protect, admin, getReports);
router.get('/users', protect, admin, getUsers);
router.delete('/users/:id', protect, admin, deleteUser);

// Resolve or delete reported items are admin only
router.put('/reports/:id/resolve', protect, admin, resolveReport);
router.delete('/reports/:id/content', protect, admin, deleteReportedContent);

// Any authenticated user can file a report
router.post('/reports', protect, fileReport);

module.exports = router;
