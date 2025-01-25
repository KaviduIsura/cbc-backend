import express from "express";
import updateProduct, {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
} from "../controllers/ProductController.js";

const productRouter = express.Router();

productRouter.post("/", createProduct);
productRouter.get("/", getProducts);
productRouter.put("/:productId", updateProduct);
productRouter.delete("/:productId", deleteProduct);
productRouter.get("/:productId", getProductById);

export default productRouter;
