// controllers/UserController.js
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export async function createUser(req, res) {
  try {
    const { firstName, lastName, email, password, type = "customer" } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    // Admin creation validation
    if (type === "admin") {
      if (!req.user || req.user.type !== "admin") {
        return res.status(403).json({
          message: "Please login as administrator to create admin account"
        });
      }
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      type,
      isBlocked: false
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        type: newUser.type
      }
    });
  } catch (error) {
    console.error("Create user error:", error);
    
    if (error.code === 11000) { // MongoDB duplicate key error
      return res.status(409).json({ 
        success: false,
        message: "Email already registered" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error creating user", 
      error: error.message 
    });
  }
}

export async function userLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.status(403).json({ 
        success: false,
        message: "Account is blocked. Please contact administrator." 
      });
    }

    // Verify password
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid password" 
      });
    }

    // Create token
    const token = jwt.sign(
      {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type,
        isBlocked: user.isBlocked,
        profilePic: user.profilePic,
      },
      process.env.SECRETE,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Login successful",
      token: token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePic: user.profilePic,
        type: user.type,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Login failed", 
      error: error.message 
    });
  }
}

export async function getUsers(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const users = await User.find({}).select('-password'); // Exclude password
    res.json({
      success: true,
      message: "Users retrieved successfully",
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving users", 
      error: error.message 
    });
  }
}

// Get current user profile
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    res.json({
      success: true,
      message: "User profile retrieved successfully",
      user: user
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving user profile", 
      error: error.message 
    });
  }
}

// Update user profile
export async function updateProfile(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const { firstName, lastName, email, profilePic } = req.body;

    // Validation
    if (!firstName || !lastName || !email) {
      return res.status(400).json({ 
        success: false,
        message: "First name, last name, and email are required" 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid email format" 
      });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: req.user._id } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Email already registered to another account" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        firstName,
        lastName,
        email,
        profilePic,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Generate new token with updated info
    const newToken = jwt.sign(
      {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        type: updatedUser.type,
        isBlocked: updatedUser.isBlocked,
        profilePic: updatedUser.profilePic,
      },
      process.env.SECRETE,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      token: newToken,
      user: updatedUser
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating profile", 
      error: error.message 
    });
  }
}

// Change password
export async function changePassword(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "All password fields are required" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 6 characters" 
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: "New passwords do not match" 
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Verify current password
    const isPasswordCorrect = bcrypt.compareSync(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ 
        success: false,
        message: "Current password is incorrect" 
      });
    }

    // Check if new password is same as current password
    const isSamePassword = bcrypt.compareSync(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be different from current password" 
      });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update password
    user.password = hashedPassword;
    user.updatedAt = Date.now();
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error changing password", 
      error: error.message 
    });
  }
}

// Upload profile picture
export async function uploadProfilePic(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Not authenticated" 
      });
    }

    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ 
        success: false,
        message: "Profile picture URL is required" 
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        profilePic,
        updatedAt: Date.now()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Generate new token with updated profile picture
    const newToken = jwt.sign(
      {
        _id: updatedUser._id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        type: updatedUser.type,
        isBlocked: updatedUser.isBlocked,
        profilePic: updatedUser.profilePic,
      },
      process.env.SECRETE,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: "Profile picture updated successfully",
      token: newToken,
      user: updatedUser
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating profile picture", 
      error: error.message 
    });
  }
}

export function isAdmin(req) {
  return req.user && req.user.type === "admin";
}

export function isCustomer(req) {
  return req.user && req.user.type === "customer";
}

// Add this function to UserController.js (anywhere, but typically near the bottom)
export function getUserFromToken(req) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.SECRETE);
    return decoded;
  } catch (error) {
    console.error("Get user from token error:", error);
    return null;
  }
}