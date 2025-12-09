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
      return res.status(409).json({ message: "Email already registered" });
    }
    
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
}

export async function userLogin(req, res) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: "User Not found" }); // Return 200 with message
    }

    // Check if user is blocked
    if (user.isBlocked) {
      return res.json({ message: "Account is blocked. Please contact administrator." });
    }

    // Verify password
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    if (!isPasswordCorrect) {
      return res.json({ message: "User not Logged in ,Invalid Password " });
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
      message: "User Logged in",
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
    res.status(500).json({ message: "Login failed", error: error.message });
  }
}

export async function getUsers(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin only." });
    }

    const users = await User.find({}).select('-password'); // Exclude password
    res.json({
      message: "Users retrieved successfully",
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Error retrieving users", error: error.message });
  }
}

// Get current user profile
export async function getCurrentUser(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User profile retrieved successfully",
      user: user
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Error retrieving user profile", error: error.message });
  }
}

export function isAdmin(req) {
  return req.user && req.user.type === "admin";
}

export function isCustomer(req) {
  return req.user && req.user.type === "customer";
}
// johndoe@example.com  securepassword123 - admin
//kavidu100@example.com  securepassword123 - customer

