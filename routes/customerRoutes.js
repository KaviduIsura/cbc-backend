// routes/customerRoutes.js
import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  getAllCustomers,
  getCustomerById,
  updateCustomerStatus,
  deleteCustomer,
  getCustomerStats
} from "../controllers/CustomerController.js";

const customerRouter = express.Router();

// All routes require admin authentication
customerRouter.use(authenticate);

// Get all customers (with pagination, search, filters)
customerRouter.get("/", getAllCustomers);

// Get customer statistics
customerRouter.get("/stats", getCustomerStats);

// Get single customer by ID
customerRouter.get("/:id", getCustomerById);

// Update customer status (block/unblock)
customerRouter.put("/:id/status", updateCustomerStatus);

// Delete customer (soft delete)
customerRouter.delete("/:id", deleteCustomer);

export default customerRouter;