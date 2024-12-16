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
});
const Review = mongoose.model("reviews", reviewSchema);
export default Review;
