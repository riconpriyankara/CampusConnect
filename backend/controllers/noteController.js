const Note = require('../models/Note');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Upload a new note
// POST /api/notes
const uploadNote = async (req, res) => {
  try {
    const { title, description, subject, semester, department } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file' });
    }

    const note = await Note.create({
      title,
      description,
      subject,
      semester: parseInt(semester),
      department,
      fileUrl: `/uploads/notes/${req.file.filename}`,
      uploadedBy: req.user._id,
    });

    // Add upload to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Note Upload',
        description: `Uploaded note: "${title}"`,
      });
      await user.save();
    }

    res.status(201).json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all notes (with search, filter, pagination)
// GET /api/notes
const getNotes = async (req, res) => {
  try {
    const { search, department, semester, page = 1, limit = 9 } = req.query;
    const query = {};

    // Filters
    if (department) {
      query.department = department;
    }
    if (semester) {
      query.semester = parseInt(semester);
    }
    
    // Search by title or subject or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .populate('uploadedBy', 'name department profilePic')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      notes,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single note by ID
// GET /api/notes/:id
const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('uploadedBy', 'name department profilePic email');

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Increment view count
    note.viewsCount += 1;
    await note.save();

    // If user is authenticated, add to recently viewed notes
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Filter out existing view of this note
        user.recentlyViewedNotes = user.recentlyViewedNotes.filter(
          (item) => item.note && item.note.toString() !== note._id.toString()
        );
        // Add to front of array
        user.recentlyViewedNotes.unshift({ note: note._id, viewedAt: new Date() });
        // Cap at 5
        user.recentlyViewedNotes = user.recentlyViewedNotes.slice(0, 5);
        await user.save();
      }
    }

    res.json({ success: true, note });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Bookmark Note
// POST /api/notes/:id/bookmark
const bookmarkNote = async (req, res) => {
  try {
    const noteId = req.params.id;
    const note = await Note.findById(noteId);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    const user = await User.findById(req.user._id);
    const isBookmarked = user.bookmarkedNotes.includes(noteId);

    if (isBookmarked) {
      user.bookmarkedNotes = user.bookmarkedNotes.filter((id) => id.toString() !== noteId);
      user.activityTimeline.push({
        activityType: 'Bookmark Remove',
        description: `Unbookmarked note: "${note.title}"`,
      });
    } else {
      user.bookmarkedNotes.push(noteId);
      user.activityTimeline.push({
        activityType: 'Bookmark Add',
        description: `Bookmarked note: "${note.title}"`,
      });
    }

    await user.save();
    res.json({ success: true, bookmarked: !isBookmarked, bookmarkedNotes: user.bookmarkedNotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Increment download count
// POST /api/notes/:id/download
const downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    note.downloadsCount += 1;
    await note.save();

    // Log to user's timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Note Download',
        description: `Downloaded note: "${note.title}"`,
      });
      await user.save();
    }

    res.json({ success: true, downloadsCount: note.downloadsCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete note
// DELETE /api/notes/:id
const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Check ownership or if user is admin
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    // Delete PDF file physically
    const filePath = path.join(__dirname, '..', note.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Note.findByIdAndDelete(req.params.id);

    // Update user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Note Delete',
        description: `Deleted note: "${note.title}"`,
      });
      await user.save();
    }

    res.json({ success: true, message: 'Note successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadNote,
  getNotes,
  getNoteById,
  bookmarkNote,
  downloadNote,
  deleteNote,
};
