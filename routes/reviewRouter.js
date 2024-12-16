import express from "express";
import {
  getAllReviews,
  saveReviews,
  toggleReviewVisibility,
} from "../controllers/ReviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", saveReviews);
reviewRouter.get("/", getAllReviews);
reviewRouter.patch("/:reviewId/visibility", toggleReviewVisibility);

export default reviewRouter;
