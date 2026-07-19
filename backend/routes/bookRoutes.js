const express = require('express');
const router = express.Router();
const {
  createBook,
  getBooks,
  getBookById,
  saveBook,
  updateBookStatus,
  deleteBook,
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .post(protect, upload.single('image'), createBook)
  .get(protect, getBooks);

router.route('/:id')
  .get(protect, getBookById)
  .delete(protect, deleteBook);

router.post('/:id/save', protect, saveBook);
router.put('/:id/status', protect, updateBookStatus);

module.exports = router;
