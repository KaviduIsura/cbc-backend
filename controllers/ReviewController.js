import Review from "../models/Review.js";
import { isCustomer } from "./UserController.js";

//can do customers
export async function saveReviews(req, res) {
  try {
    if (!isCustomer(req)) {
      res.json({
        message: "Please login as customer to add reviews",
      });
    }
    const newReview = req.body;
    newReview.email = req.user.email;

    const review = new Review(newReview);
    await review.save();
    res.status(200).json({
      message: "Review saved successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

//can do all customers and admin
export async function getReviews(req, res) {}

//can do only admin (delete)
export async function deleteReviwe(req, res) {}
