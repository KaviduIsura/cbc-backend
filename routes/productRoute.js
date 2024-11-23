import express from "express";
import {
  deleteProduct,
  getProductByName,
  getProducts,
  saveProduct,
} from "../controllers/ProductController.js";

const productRouter = express.Router();

productRouter.get("/", getProducts);
productRouter.post("/", saveProduct);
productRouter.delete("/:name", deleteProduct);

productRouter.get("/:name", getProductByName);

export default productRouter;
