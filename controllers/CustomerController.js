// controllers/CustomerController.js
import User from "../models/User.js";

// Get all customers (non-admin users)
export async function getAllCustomers(req, res) {
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
    let query = { type: "customer" }; // Only get customers, not admins

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

    // Get customers with pagination
    const customers = await User.find(query)
      .select('-password') // Exclude password
      .sort(sort)
      .skip(skip)
      .limit(limitInt);

    // Calculate stats
    const totalCustomers = await User.countDocuments({ type: "customer" });
    const activeCustomers = await User.countDocuments({ 
      type: "customer", 
      isBlocked: false 
    });
    const blockedCustomers = await User.countDocuments({ 
      type: "customer", 
      isBlocked: true 
    });

    res.json({
      success: true,
      message: "Customers retrieved successfully",
      customers,
      pagination: {
        currentPage: pageInt,
        totalPages: Math.ceil(total / limitInt),
        totalItems: total,
        itemsPerPage: limitInt
      },
      stats: {
        total: totalCustomers,
        active: activeCustomers,
        blocked: blockedCustomers
      }
    });
  } catch (error) {
    console.error("Get customers error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving customers", 
      error: error.message 
    });
  }
}

// Get single customer by ID
export async function getCustomerById(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;

    const customer = await User.findOne({ 
      _id: id, 
      type: "customer" 
    }).select('-password');

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    res.json({
      success: true,
      message: "Customer retrieved successfully",
      customer
    });
  } catch (error) {
    console.error("Get customer by ID error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving customer", 
      error: error.message 
    });
  }
}

// Update customer status (block/unblock)
export async function updateCustomerStatus(req, res) {
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

    const customer = await User.findOne({ 
      _id: id, 
      type: "customer" 
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Update customer status
    customer.isBlocked = isBlocked;
    
    // Add status change reason if provided
    if (reason) {
      customer.statusNotes = customer.statusNotes || [];
      customer.statusNotes.push({
        date: new Date(),
        action: isBlocked ? "blocked" : "unblocked",
        reason: reason,
        performedBy: req.user._id
      });
    }

    await customer.save();

    const updatedCustomer = await User.findById(id).select('-password');

    res.json({
      success: true,
      message: `Customer ${isBlocked ? "blocked" : "unblocked"} successfully`,
      customer: updatedCustomer
    });
  } catch (error) {
    console.error("Update customer status error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error updating customer status", 
      error: error.message 
    });
  }
}

// Delete customer (soft delete)
export async function deleteCustomer(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    const { id } = req.params;

    const customer = await User.findOne({ 
      _id: id, 
      type: "customer" 
    });

    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: "Customer not found" 
      });
    }

    // Instead of deleting, mark as deleted
    customer.isDeleted = true;
    customer.deletedAt = new Date();
    customer.deletedBy = req.user._id;
    await customer.save();

    res.json({
      success: true,
      message: "Customer deleted successfully"
    });
  } catch (error) {
    console.error("Delete customer error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error deleting customer", 
      error: error.message 
    });
  }
}

// Get customer statistics
export async function getCustomerStats(req, res) {
  try {
    // Check if user is admin
    if (!req.user || req.user.type !== "admin") {
      return res.status(403).json({ 
        success: false,
        message: "Access denied. Admin only." 
      });
    }

    // Total customers
    const totalCustomers = await User.countDocuments({ type: "customer" });
    
    // Active customers (not blocked)
    const activeCustomers = await User.countDocuments({ 
      type: "customer", 
      isBlocked: false 
    });
    
    // Blocked customers
    const blockedCustomers = await User.countDocuments({ 
      type: "customer", 
      isBlocked: true 
    });

    // New customers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await User.countDocuments({
      type: "customer",
      createdAt: { $gte: startOfMonth }
    });

    // Customer growth percentage
    const startOfLastMonth = new Date(startOfMonth);
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
    
    const customersLastMonth = await User.countDocuments({
      type: "customer",
      createdAt: { 
        $gte: startOfLastMonth,
        $lt: startOfMonth 
      }
    });

    const growthPercentage = customersLastMonth > 0 
      ? ((newCustomersThisMonth / customersLastMonth) * 100).toFixed(1)
      : 100;

    res.json({
      success: true,
      message: "Customer statistics retrieved successfully",
      stats: {
        total: totalCustomers,
        active: activeCustomers,
        blocked: blockedCustomers,
        newThisMonth: newCustomersThisMonth,
        growthPercentage: parseFloat(growthPercentage),
        activePercentage: totalCustomers > 0 
          ? ((activeCustomers / totalCustomers) * 100).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    console.error("Get customer stats error:", error);
    res.status(500).json({ 
      success: false,
      message: "Error retrieving customer statistics", 
      error: error.message 
    });
  }
}