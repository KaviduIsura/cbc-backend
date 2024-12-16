import express from "express";
import {
  getAllReviews,
  getFilteredReviews,
  saveReviews,
  toggleReviewVisibility,
} from "../controllers/ReviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", saveReviews);
reviewRouter.get("/", getAllReviews);
reviewRouter.patch("/:reviewId/visibility", toggleReviewVisibility);
reviewRouter.get("/customer-reviews",getFilteredReviews)

export default reviewRouter;
