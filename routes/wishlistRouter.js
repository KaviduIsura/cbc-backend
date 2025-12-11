import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  checkInWishlist,
  getWishlistCount
} from "../controllers/WishlistController.js";

const wishlistRouter = express.Router();

// Add a test route first (without authentication)
wishlistRouter.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Wishlist API is working!",
    timestamp: new Date().toISOString()
  });
});

// All wishlist routes require authentication
wishlistRouter.use(authenticate);

wishlistRouter.get("/", getWishlist);
wishlistRouter.post("/", addToWishlist);
wishlistRouter.delete("/item/:productId", removeFromWishlist);
wishlistRouter.delete("/clear", clearWishlist);
wishlistRouter.get("/check/:productId", checkInWishlist);
wishlistRouter.get("/count", getWishlistCount);

export default wishlistRouter;