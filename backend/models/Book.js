const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a book title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price'],
      min: [0, 'Price cannot be negative'],
    },
    condition: {
      type: String,
      required: [true, 'Please specify the book condition'],
      enum: ['New', 'Like New', 'Very Good', 'Good', 'Acceptable'],
    },
    department: {
      type: String,
      required: [true, 'Please specify the department'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Please specify the semester'],
      min: 1,
      max: 8,
    },
    imageUrl: {
      type: String,
      required: [true, 'Please upload a book image'],
    },
    soldBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['available', 'sold'],
      default: 'available',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Book', bookSchema);
