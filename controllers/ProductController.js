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
      res.status(403).json({
        message: error,
      });
    });
}
export function getProducts(req, res) {
  Product.find({})
    .then((products) => {
      res.json({
        list: products,
      });
    })
    .catch((error) => {
      res.json({
        message: error,
      });
    });
}
export function deleteProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Please login as administrator to delete products",
    });
    return;
  }

  const productId = req.params.productId;

  Product.deleteOne({ productId: productId })
    .then(() => {
      res.json({
        message: "Product deleted",
      });
    })
    .catch((error) => {
      res.status(403).json({
        message: error,
      });
    });
}

//update product
export default function updateProduct(req, res) {
  if (!isAdmin(req)) {
    res.status(403).json({
      message: "Please login as administrator to delete products",
    });
    return;
  }
  const productId = req.params.productId;
  const newProductData = req.body;

  Product.updateOne({ productId: productId }, newProductData)
    .then(() => {
      res.status(200).json({
        message: "Product updated",
      });
    })
    .catch((error) => {
      res.status(403).json({
        message: error,
      });
    });
}

//get product by id
export async function getProductById(req, res) {
  try {
    const productId = req.params.productId;

    const product = await Product.findOne({ productId: productId });
    res.json(product);
  } catch (e) {
    res.status(500).json({
      message: e,
    });
  }
}
