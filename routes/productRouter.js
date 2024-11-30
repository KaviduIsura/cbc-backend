import express from "express";
import {
  createProduct,
  getProducts,
} from "../controllers/ProductController.js";

const productRouter = express.Router();

productRouter.post("/", createProduct);
productRouter.get("/", getProducts);

export default productRouter;
