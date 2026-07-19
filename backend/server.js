const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads without stale browser caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
}));

// Ensure directories exist on startup
const uploadFolders = ['profiles', 'books', 'banners', 'notes', 'general'];
uploadFolders.forEach((folder) => {
  const dir = path.join(__dirname, 'uploads', folder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Import Middlewares
const { protect } = require('./middleware/auth');

// Import Schemas for Global Search
const Note = require('./models/Note');
const Book = require('./models/Book');
const Doubt = require('./models/Doubt');
const Event = require('./models/Event');

// Global Search API Endpoint
app.get('/api/search', protect, async (req, res) => {
  try {
    const q = req.query.q || '';
    if (!q) {
      return res.json({ notes: [], books: [], doubts: [], events: [] });
    }

    const regexQuery = { $regex: q, $options: 'i' };

    const notesPromise = Note.find({
      $or: [{ title: regexQuery }, { subject: regexQuery }, { description: regexQuery }],
    })
      .populate('uploadedBy', 'name department profilePic')
      .sort({ createdAt: -1 })
      .limit(6);

    const booksPromise = Book.find({
      status: 'available',
      $or: [{ title: regexQuery }, { description: regexQuery }],
    })
      .populate('soldBy', 'name department profilePic')
      .sort({ createdAt: -1 })
      .limit(6);

    const doubtsPromise = Doubt.find({
      $or: [{ title: regexQuery }, { description: regexQuery }],
    })
      .populate('author', 'name department profilePic')
      .sort({ createdAt: -1 })
      .limit(6);

    const eventsPromise = Event.find({
      $or: [{ title: regexQuery }, { description: regexQuery }, { venue: regexQuery }],
    })
      .populate('organizer', 'name department profilePic')
      .sort({ createdAt: -1 })
      .limit(6);

    // Execute concurrently for performance
    const [notes, books, doubts, events] = await Promise.all([
      notesPromise,
      booksPromise,
      doubtsPromise,
      eventsPromise,
    ]);

    res.json({
      success: true,
      results: {
        notes,
        books,
        doubts,
        events,
      },
    });
  } catch (error) {
    console.error('Global Search Error:', error);
    res.status(500).json({ success: false, message: 'Global search failed' });
  }
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/notes', require('./routes/noteRoutes'));
app.use('/api/books', require('./routes/bookRoutes'));
app.use('/api/doubts', require('./routes/doubtRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Fallback Route for API
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  console.error('Express Error Handler:', err);
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
