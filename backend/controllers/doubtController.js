const Doubt = require('../models/Doubt');
const Answer = require('../models/Answer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// Create a new doubt question
// POST /api/doubts
const createDoubt = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    let tagList = [];
    if (tags) {
      tagList = Array.isArray(tags) ? tags : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const doubt = await Doubt.create({
      title,
      description,
      tags: tagList,
      author: req.user._id,
    });

    // Log to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Doubt Post',
        description: `Posted a doubt: "${title}"`,
      });
      await user.save();
    }

    res.status(201).json({ success: true, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doubts with search, tags, sort filters, pagination
// GET /api/doubts
const getDoubts = async (req, res) => {
  try {
    const { search, tag, sort, page = 1, limit = 10 } = req.query;
    
    // Construct match query
    const matchQuery = {};
    if (tag) {
      matchQuery.tags = tag;
    }
    if (search) {
      matchQuery.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Determine sorting criteria
    let sortStage = { createdAt: -1 }; // default: latest
    if (sort === 'trending') {
      sortStage = { upvotesCount: -1, viewsCount: -1, createdAt: -1 };
    } else if (sort === 'most_answered') {
      sortStage = { answersCount: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Dynamic aggregation to include counts for upvotes and answers
    const doubtsAggregate = await Doubt.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: 'answers',
          localField: '_id',
          foreignField: 'doubt',
          as: 'answers',
        },
      },
      {
        $addFields: {
          answersCount: { $size: '$answers' },
          upvotesCount: { $size: { $ifNull: ['$upvotes', []] } },
        },
      },
      { $sort: sortStage },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    // Populate user profiles and accepted answer detail
    const doubts = await Doubt.populate(doubtsAggregate, [
      { path: 'author', select: 'name department profilePic' },
      { path: 'acceptedAnswer' },
    ]);

    const total = await Doubt.countDocuments(matchQuery);

    res.json({
      success: true,
      doubts,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get doubt by ID with all replies
// GET /api/doubts/:id
const getDoubtById = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id)
      .populate('author', 'name department profilePic email')
      .populate('acceptedAnswer');

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Increment views
    doubt.viewsCount += 1;
    await doubt.save();

    // Get answers manually
    const answers = await Answer.find({ doubt: doubt._id })
      .populate('author', 'name department profilePic email')
      .sort({ isAccepted: -1, upvotes: -1, createdAt: 1 }); // accepted first, then upvotes count, then date

    res.json({ success: true, doubt, answers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle upvote on doubt
// POST /api/doubts/:id/upvote
const upvoteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const userId = req.user._id;
    const isUpvoted = doubt.upvotes.includes(userId);

    if (isUpvoted) {
      // Remove upvote
      doubt.upvotes = doubt.upvotes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Add upvote
      doubt.upvotes.push(userId);
      
      // Notify author if it's not their own question
      if (doubt.author.toString() !== userId.toString()) {
        await Notification.create({
          user: doubt.author,
          type: 'doubt_upvote',
          message: `${req.user.name} upvoted your question: "${doubt.title}"`,
          link: `/doubts/${doubt._id}`,
        });
      }
    }

    await doubt.save();
    res.json({ success: true, upvoted: !isUpvoted, upvotesCount: doubt.upvotes.length, upvotes: doubt.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete doubt
// DELETE /api/doubts/:id
const deleteDoubt = async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Auth check
    if (doubt.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this doubt' });
    }

    // Delete associated answers
    await Answer.deleteMany({ doubt: doubt._id });
    await Doubt.findByIdAndDelete(req.params.id);

    // Log to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Doubt Delete',
        description: `Deleted doubt: "${doubt.title}"`,
      });
      await user.save();
    }

    res.json({ success: true, message: 'Doubt and all its answers successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Post a new answer to a doubt
// POST /api/doubts/:id/answers
const createAnswer = async (req, res) => {
  try {
    const { content } = req.body;
    const doubt = await Doubt.findById(req.params.id);

    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    const answer = await Answer.create({
      doubt: doubt._id,
      content,
      author: req.user._id,
    });

    // Notify doubt author if someone else answered
    if (doubt.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: doubt.author,
        type: 'doubt_answer',
        message: `${req.user.name} answered your question: "${doubt.title}"`,
        link: `/doubts/${doubt._id}`,
      });
    }

    // Log to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Doubt Answer',
        description: `Answered question: "${doubt.title}"`,
      });
      await user.save();
    }

    res.status(201).json({ success: true, answer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle upvote on answer
// POST /api/answers/:id/upvote
const upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('doubt', 'title');

    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const userId = req.user._id;
    const isUpvoted = answer.upvotes.includes(userId);

    if (isUpvoted) {
      answer.upvotes = answer.upvotes.filter((id) => id.toString() !== userId.toString());
    } else {
      answer.upvotes.push(userId);

      // Notify answer author
      if (answer.author.toString() !== userId.toString()) {
        await Notification.create({
          user: answer.author,
          type: 'doubt_upvote',
          message: `${req.user.name} liked your answer in: "${answer.doubt.title}"`,
          link: `/doubts/${answer.doubt._id}`,
        });
      }
    }

    await answer.save();
    res.json({ success: true, upvoted: !isUpvoted, upvotesCount: answer.upvotes.length, upvotes: answer.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Accept an answer for a doubt question
// PUT /api/answers/:id/accept
const acceptAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id).populate('doubt');

    if (!answer) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const doubt = answer.doubt;

    // Verify req.user is author of the doubt
    if (doubt.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only the question author can accept answers' });
    }

    // Toggle acceptance logic
    const wasAccepted = answer.isAccepted;

    if (wasAccepted) {
      // Unaccept this answer
      answer.isAccepted = false;
      doubt.acceptedAnswer = null;
    } else {
      // Unaccept any other answer first
      await Answer.updateMany({ doubt: doubt._id }, { $set: { isAccepted: false } });
      
      answer.isAccepted = true;
      doubt.acceptedAnswer = answer._id;

      // Notify answer author
      if (answer.author.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: answer.author,
          type: 'answer_accepted',
          message: `Your answer was accepted as helpful for question: "${doubt.title}"`,
          link: `/doubts/${doubt._id}`,
        });
      }
    }

    await answer.save();
    await doubt.save();

    res.json({ success: true, isAccepted: answer.isAccepted, doubt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createDoubt,
  getDoubts,
  getDoubtById,
  upvoteDoubt,
  deleteDoubt,
  createAnswer,
  upvoteAnswer,
  acceptAnswer,
};
