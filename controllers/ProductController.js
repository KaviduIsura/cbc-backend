import Product from "../models/Product.js";
import { isAdmin } from "./UserController.js";

export function createProduct(req, res) {
  if (!isAdmin(req)) {
    res.json({
      message: "Please login as administrator to add products!",
    });
    return;
  }

  const newProductData = req.body;

  const product = new Product(newProductData);

  product
    .save()
    .then(() => {
      res.json({
        message: "Product Created",
      });
    })
    .catch((error) => {
      res.json({
        message: error,
      });
    });
}
