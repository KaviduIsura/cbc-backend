

import express from "express";
import {
  createUser,
  getUsers,
  userLogin,
  getCurrentUser
} from "../controllers/UserController.js";

const userRouter = express.Router();

// Public routes
userRouter.post("/", createUser); // Signup
userRouter.post("/login", userLogin); // Login

// Protected routes (require authentication)
userRouter.get("/", getUsers); // Get all users (admin only)
userRouter.get("/me", getCurrentUser); // Get current user profile

export default userRouter;

