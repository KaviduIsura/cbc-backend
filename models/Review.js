import mongoose, { Schema } from "mongoose";

const reviewSchema = mongoose.Schema({
  email: {
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
  },
  createdAt: {
    type: Date,
    require: true,
    default: Date.now,
  },
  hidden: {
    type: Boolean,
    default: false, // Default is visible
  },
});
const Review = mongoose.model("reviews", reviewSchema);
export default Review;
