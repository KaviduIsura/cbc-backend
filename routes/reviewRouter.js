import express from "express";
import { saveReviews } from "../controllers/ReviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/", saveReviews);

export default reviewRouter;
