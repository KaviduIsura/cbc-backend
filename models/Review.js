import mongoose, { Schema } from "mongoose";

const reviewSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  review: {
    type: String,
    required: true,
  },
  rating: {
    type: number,
    required: true,
  },
  createdAt: {
    type: Date,
    require: true,
    default: Date.now,
  },
});
const reviewModel = mongoose.Model("reviews", reviewSchema);
export default reviewModel;
