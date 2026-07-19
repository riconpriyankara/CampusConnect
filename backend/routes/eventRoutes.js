const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  bookmarkEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .post(protect, upload.single('banner'), createEvent)
  .get(protect, getEvents);

router.route('/:id')
  .get(protect, getEventById)
  .delete(protect, deleteEvent);

router.post('/:id/bookmark', protect, bookmarkEvent);

module.exports = router;
