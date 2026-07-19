const express = require('express');
const router = express.Router();
const {
  uploadNote,
  getNotes,
  getNoteById,
  bookmarkNote,
  downloadNote,
  deleteNote,
} = require('../controllers/noteController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .post(protect, upload.single('file'), uploadNote)
  .get(protect, getNotes);

router.route('/:id')
  .get(protect, getNoteById)
  .delete(protect, deleteNote);

router.post('/:id/bookmark', protect, bookmarkNote);
router.post('/:id/download', protect, downloadNote);

module.exports = router;
