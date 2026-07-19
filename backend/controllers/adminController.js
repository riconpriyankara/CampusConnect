const User = require('../models/User');
const Note = require('../models/Note');
const Book = require('../models/Book');
const Doubt = require('../models/Doubt');
const Event = require('../models/Event');
const Report = require('../models/Report');
const Answer = require('../models/Answer');

// Get overall stats for dashboard
// GET /api/admin/stats
const getStats = async (req, res) => {
  try {
    const usersCount = await User.countDocuments({ role: 'student' });
    const notesCount = await Note.countDocuments();
    const booksCount = await Book.countDocuments();
    const doubtsCount = await Doubt.countDocuments();
    const eventsCount = await Event.countDocuments();
    const pendingReportsCount = await Report.countDocuments({ status: 'Pending' });

    res.json({
      success: true,
      stats: {
        users: usersCount,
        notes: notesCount,
        books: booksCount,
        doubts: doubtsCount,
        events: eventsCount,
        reports: pendingReportsCount,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reported items
// GET /api/admin/reports
const getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reportedBy', 'name email department')
      .populate({
        path: 'itemId',
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// File a new report
// POST /api/admin/reports
const fileReport = async (req, res) => {
  try {
    const { itemType, itemId, reason } = req.body;

    const report = await Report.create({
      reportedBy: req.user._id,
      itemType,
      itemId,
      reason,
    });

    res.status(201).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Resolve a report (dismiss it)
// PUT /api/admin/reports/:id/resolve
const resolveReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.status = 'Resolved';
    await report.save();

    res.json({ success: true, message: 'Report marked as resolved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete reported content
// DELETE /api/admin/reports/:id/content
const deleteReportedContent = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const { itemType, itemId } = report;

    // Delete content depending on type
    if (itemType === 'Note') {
      await Note.findByIdAndDelete(itemId);
    } else if (itemType === 'Book') {
      await Book.findByIdAndDelete(itemId);
    } else if (itemType === 'Doubt') {
      await Doubt.findByIdAndDelete(itemId);
      await Answer.deleteMany({ doubt: itemId });
    } else if (itemType === 'Event') {
      await Event.findByIdAndDelete(itemId);
    } else if (itemType === 'Answer') {
      await Answer.findByIdAndDelete(itemId);
    }

    // Resolve the report
    report.status = 'Resolved';
    await report.save();

    // Also mark other reports on the same item as resolved
    await Report.updateMany({ itemId: itemId }, { $set: { status: 'Resolved' } });

    res.json({ success: true, message: `Reported ${itemType} successfully deleted` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all users
// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user profile
// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Cannot delete admin account' });
    }

    // Purge user content
    await Note.deleteMany({ uploadedBy: user._id });
    await Book.deleteMany({ soldBy: user._id });
    await Doubt.deleteMany({ author: user._id });
    await Answer.deleteMany({ author: user._id });
    await Event.deleteMany({ organizer: user._id });
    await Report.deleteMany({ reportedBy: user._id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'User and all related content deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getReports,
  fileReport,
  resolveReport,
  deleteReportedContent,
  getUsers,
  deleteUser,
};
