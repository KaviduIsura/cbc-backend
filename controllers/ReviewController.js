// controllers/ReviewController.js
import mongoose from "mongoose";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { isAdmin, isCustomer } from "./UserController.js";

// Add review for a product
export async function saveReviews(req, res) {
  try {
    // User should be attached by auth middleware
    const user = req.user;
    if (!user || !isCustomer(req)) {
      return res.status(403).json({
        message: "Please login as customer to add reviews",
      });
    }

    const { productId, review, rating, userName } = req.body;
    
    // Validate input
    if (!productId || !review || !rating) {
      return res.status(400).json({
        message: "productId, review, and rating are required"
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5"
      });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ 
      productId: productId, 
      email: user.email 
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this product"
      });
    }

    const newReview = new Review({
      productId,
      email: user.email,
      userName: userName || user.firstName || user.email.split('@')[0],
      review,
      rating,
      status: 'pending' // Set as pending by default
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review submitted for admin approval",
      review: newReview
    });
  } catch (error) {
    console.error("Save review error:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already reviewed this product"
      });
    }
    res.status(500).json({
      message: error.message,
    });
  }
}

// Get reviews for a specific product (only approved reviews)
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required"
      });
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Only get approved reviews that are not hidden
    const reviews = await Review.find({ 
      productId, 
      status: 'approved',
      hidden: false 
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .select('-hidden -status -__v -adminComment');

    const totalReviews = await Review.countDocuments({ 
      productId, 
      status: 'approved',
      hidden: false 
    });

    const totalPages = Math.ceil(totalReviews / limitNum);

    // Fix: Use new mongoose.Types.ObjectId() for aggregation
    // Get rating distribution - Only from approved reviews
    const ratingDistribution = await Review.aggregate([
      { 
        $match: { 
          productId: new mongoose.Types.ObjectId(productId), // FIXED HERE
          status: 'approved',
          hidden: false 
        }
      },
      { 
        $group: {
          _id: "$rating",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    // Get average rating - Only from approved reviews
    const averageRating = await Review.aggregate([
      { 
        $match: { 
          productId: new mongoose.Types.ObjectId(productId), // FIXED HERE
          status: 'approved',
          hidden: false 
        }
      },
      { 
        $group: {
          _id: null,
          average: { $avg: "$rating" },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalReviews,
        totalPages
      },
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      averageRating: averageRating.length > 0 ? averageRating[0].average.toFixed(1) : 0,
      totalReviews: averageRating.length > 0 ? averageRating[0].count : 0
    });
  } catch (error) {
    console.error("Get product reviews error:", error);
    res.status(500).json({
      message: "Error fetching reviews",
      error: error.message
    });
  }
}

// Update: Function to update product rating based on approved reviews
async function updateProductRating(productId) {
  try {
    const approvedReviews = await Review.find({ 
      productId, 
      status: 'approved',
      hidden: false 
    });
    
    if (approvedReviews.length > 0) {
      const totalRating = approvedReviews.reduce((sum, rev) => sum + rev.rating, 0);
      const averageRating = totalRating / approvedReviews.length;
      
      await Product.findByIdAndUpdate(productId, {
        rating: parseFloat(averageRating.toFixed(1)),
        reviewCount: approvedReviews.length
      });
    } else {
      // No approved reviews, reset to default
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (error) {
    console.error("Error updating product rating:", error);
  }
}

// Check if user has reviewed a product
export async function checkUserReview(req, res) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const { productId } = req.query;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    const review = await Review.findOne({
      productId: productId,
      email: user.email
    });

    if (!review) {
      return res.json({
        success: true,
        status: 'none'
      });
    }

    return res.json({
      success: true,
      status: review.status
    });
  } catch (error) {
    console.error("Check user review error:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
}

// ADMIN: Get all reviews with filtering options
export async function getAllReviews(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Login as administrator to View all Reviews",
      });
    }
    
    const { 
      page = 1, 
      limit = 20, 
      status, 
      productId,
      search 
    } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (productId) {
      query.productId = productId;
    }
    
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { review: { $regex: search, $options: 'i' } }
      ];
    }

    const reviews = await Review.find(query)
      .populate('productId', 'productName name images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Review.countDocuments(query);

    res.json({
      success: true,
      reviews,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
}

// ADMIN: Update review status (approve/reject)
export async function updateReviewStatus(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Login as administrator to manage reviews",
      });
    }
    
    const { reviewId } = req.params;
    const { status, adminComment } = req.body;
    
    // Validate status
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Must be 'pending', 'approved', or 'rejected'"
      });
    }

    const review = await Review.findById(reviewId).populate('productId');
    
    if (!review) {
      return res.status(404).json({ 
        message: "Review not found" 
      });
    }

    // Update review
    review.status = status;
    if (adminComment) {
      review.adminComment = adminComment;
    }
    
    await review.save();

    // If review is approved, update product rating
    if (status === 'approved' && review.productId) {
      await updateProductRating(review.productId._id);
    }
    
    // If review is being unapproved (rejected or pending), also update product rating
    if ((status === 'rejected' || status === 'pending') && review.status === 'approved') {
      await updateProductRating(review.productId._id);
    }

    res.status(200).json({
      success: true,
      message: `Review ${status} successfully`,
      review
    });
  } catch (error) {
    console.error("Update review status error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
}

// ADMIN: Delete review
export async function deleteReview(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Login as administrator to delete reviews",
      });
    }
    
    const { reviewId } = req.params;
    
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ 
        message: "Review not found" 
      });
    }

    // Get productId before deleting
    const productId = review.productId;
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);
    
    // Update product rating after deletion
    await updateProductRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      message: error.message,
    });
  }
}

// Toggle review visibility (admin only) - Updated to handle status changes
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
    ).populate('productId', 'productName name');

    if (!updatedReview) {
      return res.status(404).json({ message: "Review not found." });
    }

    // Update product rating if review is hidden/unhidden
    if (updatedReview.productId && updatedReview.status === 'approved') {
      await updateProductRating(updatedReview.productId._id);
    }

    res.status(200).json({
      success: true,
      message: "Review visibility updated.",
      updatedReview,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
    });
  }
}