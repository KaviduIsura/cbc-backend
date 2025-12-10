import express from "express";
import { 
  createOrder, 
  getOrders, 
  getQuote,
  getOrderById,
  updateOrderStatus,
  getUserOrders,
  markAsPaid
} from "../controllers/OrderController.js";
import { authenticate } from "../middleware/auth.js"; // You'll need to create this middleware

const orderRouter = express.Router();

// Apply authentication middleware to all routes
orderRouter.use(authenticate);

// Customer routes
orderRouter.post("/", createOrder); // Create new order
orderRouter.get("/my-orders", getUserOrders); // Get current user's orders
orderRouter.get("/:id", getOrderById); // Get specific order by ID

// Admin routes
orderRouter.get("/", getOrders); // Get all orders (admin only)
orderRouter.put("/:id/status", updateOrderStatus); // Update order status (admin only)
orderRouter.put("/:id/mark-paid", markAsPaid); // Mark COD order as paid (admin only)

// Public route (no auth required for quote)
orderRouter.post("/quote", getQuote);

export default orderRouter;