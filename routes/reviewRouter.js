// routes/reviewRouter.js
import express from "express";
import {
  getAllReviews,
  saveReviews,
  toggleReviewVisibility,
  getProductReviews,
  updateReviewStatus,
  deleteReview,
  checkUserReview
} from "../controllers/ReviewController.js";

const reviewRouter = express.Router();

// Customer routes
reviewRouter.post("/", saveReviews);
reviewRouter.get("/product/:productId", getProductReviews);
reviewRouter.get("/user-check", checkUserReview); 

// Admin routes
reviewRouter.get("/", getAllReviews);
reviewRouter.patch("/:reviewId/status", updateReviewStatus);
reviewRouter.delete("/:reviewId", deleteReview);
reviewRouter.patch("/:reviewId/visibility", toggleReviewVisibility);

export default reviewRouter;