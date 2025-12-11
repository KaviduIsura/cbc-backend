// models/Review.js
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  email: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  hidden: {
    type: Boolean,
    default: false,
  },
  adminComment: {
    type: String,
    default: ''
  }
});

// Add compound index to ensure one review per product per user
reviewSchema.index({ productId: 1, email: 1 }, { unique: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;