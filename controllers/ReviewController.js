import Review from "../models/Review.js";
import { isAdmin, isCustomer } from "./UserController.js";

//can do customers
export async function saveReviews(req, res) {
  try {
    if (!isCustomer(req)) {
      res.status(403).json({
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

//can view all customers and admin
export async function getAllReviews(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Login as administrator to View all Reviews",
      });
    }
    const reviews = await Review.find({});
    res.json({
      message: reviews,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

//can view filtered reviews for customers
export async function getFilteredReviews(req,res){
  try{
   const filteredReview =await Review.find({hidden:false})
   res.status(200).json({
    message:filteredReview
   })
  }catch(error){
    res.status(500).json({
      message:error.message
    })
  }
}


//can do only admin (hide reviews)
export async function toggleReviewVisibility(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Login as administrator to edit Reviews",
      });
    }
    const { reviewId } = req.params;
    const { hidden } = req.body;

    if (typeof hidden !== "boolean") {
      return res.status(400).json({
        message: "Invalid hidden status.",
      });
    }
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId,
      { hidden },
      { new: true }
    );
    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found." });
    }
    res.status(200).json({
      message: "Review visibility updated.",
      updatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}
