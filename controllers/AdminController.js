// controllers/AdminController.js
import User from "../models/User.js";
import bcrypt from "bcrypt";

// Get all admins
export async function getAllAdmins(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      search = "", 
      status = "all",
      sortBy = "createdAt",
      sortOrder = "desc" 
    } = req.query;

    // Build query
    let query = { type: "admin" }; // Only get admins

    // Search filter
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    // Status filter
    if (status === "active") {
      query.isBlocked = false;
    } else if (status === "blocked") {
      query.isBlocked = true;
    }

    // Calculate pagination
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Get total count
    const total = await User.countDocuments(query);

    // Get admins with pagination
    const admins = await User.find(query)
      .select('-password') // Exclude password
      .sort(sort)
      .skip(skip)
      .limit(limitInt);

    // Calculate stats
    const totalAdmins = await User.countDocuments({ type: "admin" });
    const activeAdmins = await User.countDocuments({ 
      type: "admin", 
      isBlocked: false 
    });
    const blockedAdmins = await User.countDocuments({ 
      type: "admin", 
      isBlocked: true 
    });

    res.json({
      success: true,
      message: "Admins retrieved successfully",
      admins,
      pagination: {
        currentPage: pageInt,
        totalPages: Math.ceil(total / limitInt),
        totalItems: total,
        itemsPerPage: limitInt
      },
      stats: {
        total: totalAdmins,
        active: activeAdmins,
        blocked: blockedAdmins,
        superAdmins: await User.countDocuments({ 
          type: "admin", 
          isSuperAdmin: true 
        })
      }
    });
  } catch (error) {
    console.error("Get admins error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving admins", 
      error: error.message 
    });
  }
}

// Get single admin by ID
export async function getAdminById(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;

    const admin = await User.findOne({ 
      _id: id, 
      type: "admin" 
    }).select('-password');

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    res.json({
      success: true,
      message: "Admin retrieved successfully",
      admin
    });
  } catch (error) {
    console.error("Get admin by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving admin", 
      error: error.message 
    });
  }
}

// Create new admin
export async function createAdmin(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { firstName, lastName, email, password, permissions = [], isSuperAdmin = false } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "Password must be at least 6 characters" 
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: "Email already registered" 
      });
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Create new admin
    const newAdmin = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      type: "admin",
      isBlocked: false,
      isSuperAdmin,
      permissions,
      createdBy: req.user._id
    });

    await newAdmin.save();

    const adminData = await User.findById(newAdmin._id).select('-password');

    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      admin: adminData
    });
  } catch (error) {
    console.error("Create admin error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({ 
        success: false,
        message: "Email already registered" 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: "Error creating admin", 
      error: error.message 
    });
  }
}

// Update admin
export async function updateAdmin(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;
    const { firstName, lastName, email, permissions, isSuperAdmin } = req.body;

    // Find admin
    const admin = await User.findOne({ 
      _id: id, 
      type: "admin" 
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Check if trying to update own super admin status
    if (id === req.user._id && typeof isSuperAdmin !== 'undefined') {
      return res.status(403).json({ 
        success: false,
        message: "You cannot change your own super admin status" 
      });
    }

    // Check if email is already taken by another user
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: id } 
      });
      
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: "Email already registered to another account" 
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
    }

    // Update admin
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (permissions) updateData.permissions = permissions;
    if (typeof isSuperAdmin !== 'undefined') updateData.isSuperAdmin = isSuperAdmin;
    updateData.updatedAt = Date.now();

    const updatedAdmin = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: "Admin updated successfully",
      admin: updatedAdmin
    });
  } catch (error) {
    console.error("Update admin error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating admin", 
      error: error.message 
    });
  }
}

// Update admin status (block/unblock)
export async function updateAdminStatus(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;
    const { isBlocked, reason } = req.body;

    if (typeof isBlocked !== "boolean") {
      return res.status(400).json({ 
        success: false,
        message: "isBlocked field is required and must be boolean" 
      });
    }

    // Prevent self-blocking
    if (id === req.user._id) {
      return res.status(403).json({ 
        success: false,
        message: "You cannot block/unblock yourself" 
      });
    }

    const admin = await User.findOne({ 
      _id: id, 
      type: "admin" 
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Update admin status
    admin.isBlocked = isBlocked;
    
    // Add status change reason if provided
    if (reason) {
      admin.statusNotes = admin.statusNotes || [];
      admin.statusNotes.push({
        date: new Date(),
        action: isBlocked ? "blocked" : "unblocked",
        reason: reason,
        performedBy: req.user._id
      });
    }

    await admin.save();

    const updatedAdmin = await User.findById(id).select('-password');

    res.json({
      success: true,
      message: `Admin ${isBlocked ? "blocked" : "unblocked"} successfully`,
      admin: updatedAdmin
    });
  } catch (error) {
    console.error("Update admin status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating admin status", 
      error: error.message 
    });
  }
}

// Reset admin password
export async function resetAdminPassword(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: "New password must be at least 6 characters" 
      });
    }

    // Find admin
    const admin = await User.findOne({ 
      _id: id, 
      type: "admin" 
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    admin.password = hashedPassword;
    admin.updatedAt = Date.now();
    await admin.save();

    res.json({
      success: true,
      message: "Admin password reset successfully"
    });
  } catch (error) {
    console.error("Reset admin password error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error resetting admin password", 
      error: error.message 
    });
  }
}

// Delete admin (soft delete)
export async function deleteAdmin(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user._id) {
      return res.status(403).json({ 
        success: false,
        message: "You cannot delete yourself" 
      });
    }

    const admin = await User.findOne({ 
      _id: id, 
      type: "admin" 
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: "Admin not found" 
      });
    }

    // Instead of deleting, mark as deleted
    admin.isDeleted = true;
    admin.deletedAt = new Date();
    admin.deletedBy = req.user._id;
    await admin.save();

    res.json({
      success: true,
      message: "Admin deleted successfully"
    });
  } catch (error) {
    console.error("Delete admin error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting admin", 
      error: error.message 
    });
  }
}

// Get admin statistics
export async function getAdminStats(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    // Total admins
    const totalAdmins = await User.countDocuments({ type: "admin" });
    
    // Active admins (not blocked)
    const activeAdmins = await User.countDocuments({ 
      type: "admin", 
      isBlocked: false 
    });
    
    // Blocked admins
    const blockedAdmins = await User.countDocuments({ 
      type: "admin", 
      isBlocked: true 
    });

    // Super admins
    const superAdmins = await User.countDocuments({ 
      type: "admin", 
      isSuperAdmin: true 
    });

    // New admins this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newAdminsThisMonth = await User.countDocuments({
      type: "admin",
      createdAt: { $gte: startOfMonth }
    });

    // Admin growth percentage
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    
    const adminsLastMonth = await User.countDocuments({
      type: "admin",
      createdAt: { 
        $gte: startOfLastMonth,
        $lt: startOfMonth 
      }
    });

    const growthPercentage = adminsLastMonth > 0 
      ? ((newAdminsThisMonth / adminsLastMonth) * 100).toFixed(1)
      : 100;

    res.json({
      success: true,
      message: "Admin statistics retrieved successfully",
      stats: {
        total: totalAdmins,
        active: activeAdmins,
        blocked: blockedAdmins,
        superAdmins: superAdmins,
        newThisMonth: newAdminsThisMonth,
        growthPercentage: parseFloat(growthPercentage),
        activePercentage: totalAdmins > 0 
          ? ((activeAdmins / totalAdmins) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving admin statistics", 
      error: error.message 
    });
  }
}