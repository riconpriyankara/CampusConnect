const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add an event title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    bannerUrl: {
      type: String,
      required: [true, 'Please upload an event banner'],
    },
    venue: {
      type: String,
      required: [true, 'Please add a venue'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date'],
    },
    time: {
      type: String,
      required: [true, 'Please specify the time'],
      trim: true,
    },
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bookmarkedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Event', eventSchema);
