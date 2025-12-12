// routes/adminRoutes.js
import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getAllAdmins,
  getAdminById,
  createAdmin,
  updateAdmin,
  updateAdminStatus,
  resetAdminPassword,
  deleteAdmin,
  getAdminStats
} from "../controllers/AdminController.js";

const adminRouter = express.Router();

// All routes require admin authentication
adminRouter.use(authenticate);

// Get all admins (with pagination, search, filters)
adminRouter.get("/", getAllAdmins);

// Get admin statistics
adminRouter.get("/stats", getAdminStats);

// Get single admin by ID
adminRouter.get("/:id", getAdminById);

// Create new admin
adminRouter.post("/", createAdmin);

// Update admin
adminRouter.put("/:id", updateAdmin);

// Update admin status (block/unblock)
adminRouter.put("/:id/status", updateAdminStatus);

// Reset admin password
adminRouter.put("/:id/reset-password", resetAdminPassword);

// Delete admin (soft delete)
adminRouter.delete("/:id", deleteAdmin);

export default adminRouter;