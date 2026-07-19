const express = require('express');
const router = express.Router();
const {
  createDoubt,
  getDoubts,
  getDoubtById,
  upvoteDoubt,
  deleteDoubt,
  createAnswer,
  upvoteAnswer,
  acceptAnswer,
} = require('../controllers/doubtController');
const { protect } = require('../middleware/auth');

router.route('/')
  .post(protect, createDoubt)
  .get(protect, getDoubts);

router.route('/:id')
  .get(protect, getDoubtById)
  .delete(protect, deleteDoubt);

router.post('/:id/upvote', protect, upvoteDoubt);
router.post('/:id/answers', protect, createAnswer);
router.post('/answers/:id/upvote', protect, upvoteAnswer);
router.put('/answers/:id/accept', protect, acceptAnswer);

module.exports = router;
