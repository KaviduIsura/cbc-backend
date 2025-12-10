// routes/userRoutes.js
import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createUser,
  getUsers,
  userLogin,
  getCurrentUser,
  updateProfile,
  changePassword,
  uploadProfilePic
} from "../controllers/UserController.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/", createUser); // Signup
userRouter.post("/login", userLogin); // Login

// Protected routes (require authentication)
userRouter.get("/", authenticate, getUsers); // Get all users (admin only)
userRouter.get("/me", authenticate, getCurrentUser); // Get current user profile
userRouter.put("/profile", authenticate, updateProfile); // Update profile
userRouter.put("/password", authenticate, changePassword); // Change password
userRouter.put("/profile-picture", authenticate, uploadProfilePic); // Upload profile picture

export default userRouter;