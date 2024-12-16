import express from "express";
import { getAllReviews, saveReviews } from "../controllers/ReviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", saveReviews);
reviewRouter.get("/", getAllReviews);

export default reviewRouter;
