import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getProductCategories,
  getFeaturedProducts
} from "../controllers/ProductController.js";

const productRouter = express.Router();

// Public routes
productRouter.get("/", getProducts);
productRouter.get("/categories", getProductCategories);
productRouter.get("/featured", getFeaturedProducts);
productRouter.get("/:productId", getProductById);

// Admin routes (require authentication)
productRouter.post("/", createProduct);
productRouter.put("/:productId", updateProduct);
productRouter.delete("/:productId", deleteProduct);

export default productRouter;