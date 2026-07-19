const Event = require('../models/Event');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');

// Create a new event
// POST /api/events
const createEvent = async (req, res) => {
  try {
    const { title, description, venue, date, time } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an event banner image' });
    }

    const event = await Event.create({
      title,
      description,
      venue,
      date: new Date(date),
      time,
      bannerUrl: `/uploads/banners/${req.file.filename}`,
      organizer: req.user._id,
    });

    // Log to user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Event Creation',
        description: `Created campus event: "${title}"`,
      });
      await user.save();
    }

    res.status(201).json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get campus events
// GET /api/events
const getEvents = async (req, res) => {
  try {
    const { search, upcoming = 'true', page = 1, limit = 9 } = req.query;
    const query = {};

    // Filter upcoming events (date >= today)
    if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.date = { $gte: today };
    }

    // Search query
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { venue: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name department profilePic email')
      .sort({ date: 1 }) // Closest dates first
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      events,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single event details
// GET /api/events/:id
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name department profilePic email');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.json({ success: true, event });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle Bookmark Event
// POST /api/events/:id/bookmark
const bookmarkEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const userId = req.user._id;
    const user = await User.findById(userId);
    const isBookmarked = user.bookmarkedEvents.includes(eventId);

    if (isBookmarked) {
      user.bookmarkedEvents = user.bookmarkedEvents.filter((id) => id.toString() !== eventId);
      event.bookmarkedBy = event.bookmarkedBy.filter((id) => id.toString() !== userId.toString());
      user.activityTimeline.push({
        activityType: 'Bookmark Event Remove',
        description: `Unbookmarked event: "${event.title}"`,
      });
    } else {
      user.bookmarkedEvents.push(eventId);
      event.bookmarkedBy.push(userId);
      user.activityTimeline.push({
        activityType: 'Bookmark Event Add',
        description: `Bookmarked event: "${event.title}"`,
      });
    }

    await user.save();
    await event.save();
    res.json({ success: true, bookmarked: !isBookmarked, bookmarkedEvents: user.bookmarkedEvents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Event
// DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Only organizer or admin can delete
    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    // Delete image physically
    const filePath = path.join(__dirname, '..', event.bannerUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Event.findByIdAndDelete(req.params.id);

    // Update user timeline
    const user = await User.findById(req.user._id);
    if (user) {
      user.activityTimeline.push({
        activityType: 'Event Delete',
        description: `Deleted event: "${event.title}"`,
      });
      await user.save();
    }

    res.json({ success: true, message: 'Event successfully deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getEventById,
  bookmarkEvent,
  deleteEvent,
};
