const Book = require('../models/Book');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Sell/List a new book
// POST /api/books
const createBook = async (req, res) => {
  try {
    const { title, description, price, condition, department, semester } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a book image' });
    }

    const book = await Book.create({
      title,
      description,
      price: parseFloat(price),
      condition,
      department,
      semester: parseInt(semester),
      imageUrl: `/uploads/books/${req.file.filename}`,
      soldBy: req.user._id,
    });

    // Add listing to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Book Listing',
        description: `Listed book for sale: "${title}" for $${price}`,
      });
      await user.save();
    }

    res.status(201).json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all books with search, filter, pagination
// GET /api/books
const getBooks = async (req, res) => {
  try {
    const { search, department, semester, condition, status, page = 1, limit = 9 } = req.query;
    const query = {};

    // Filters
    if (department) {
      query.department = department;
    }
    if (semester) {
      query.semester = parseInt(semester);
    }
    if (condition) {
      query.condition = condition;
    }
    if (status) {
      query.status = status;
    } else {
      // Default: show available books first
      // query.status = 'available';
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Book.countDocuments(query);
    const books = await Book.find(query)
      .populate('soldBy', 'name department profilePic email')
      .sort({ status: 1, createdAt: -1 }) // available first, then latest
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      books,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single book details
// GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).populate('soldBy', 'name department profilePic email bio');

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Save Book Listing
// POST /api/books/:id/save
const saveBook = async (req, res) => {
  try {
    const bookId = req.params.id;
    const book = await Book.findById(bookId);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book listing not found' });
    }

    const user = await User.findById(req.user._id);
    const isSaved = user.savedBooks.includes(bookId);

    if (isSaved) {
      user.savedBooks = user.savedBooks.filter((id) => id.toString() !== bookId);
      user.activityTimeline.push({
        activityType: 'Save Book Remove',
        description: `Removed book bookmark: "${book.title}"`,
      });
    } else {
      user.savedBooks.push(bookId);
      user.activityTimeline.push({
        activityType: 'Save Book Add',
        description: `Saved book listing: "${book.title}"`,
      });
    }

    await user.save();
    res.json({ success: true, saved: !isSaved, savedBooks: user.savedBooks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update book listing status (available / sold)
// PUT /api/books/:id/status
const updateBookStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Only seller can update
    if (book.soldBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this book' });
    }

    book.status = status;
    await book.save();

    // Log to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Book Status Update',
        description: `Marked book "${book.title}" as ${status}`,
      });
      await user.save();
    }

    res.json({ success: true, book });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete book listing
// DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({ success: false, message: 'Book listing not found' });
    }

    // Only seller or admin can delete
    if (book.soldBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this book listing' });
    }

    // Delete image physically
    const filePath = path.join(__dirname, '..', book.imageUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Book.findByIdAndDelete(req.params.id);

    // Update user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Book Listing Delete',
        description: `Deleted listing for book "${book.title}"`,
      });
      await user.save();
    }

    res.json({ success: true, message: 'Book listing successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBook,
  getBooks,
  getBookById,
  saveBook,
  updateBookStatus,
  deleteBook,
};
