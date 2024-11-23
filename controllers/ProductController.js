import Product from "../models/products.js";

export function getProducts(req, res) {
  Product.find().then((productList) => {
    res.json({
      message: productList,
    });
  });
}
export function getProductByName(req, res) {
  const name = req.params.name;

  Product.find({ name: name })
    .then((productList) => {
      if (productList.length == 0) {
        res.json({
          message: "Product Not Found",
        });
      } else {
        res.json({
          message: productList,
        });
      }
    })
    .catch(() => {
      res.json({
        message: "Student Not Found",
      });
    });
}
export function saveProduct(req, res) {
  const product = new Product(req.body);
  product
    .save()
    .then(() => {
      res.json({
        message: "Product saved successfully",
      });
    })
    .catch(() =>
      res.json({
        message: "Error",
      })
    );
}

export function deleteProduct(req, res) {
  Product.deleteOne({ name: req.params.name }).then(() => {
    res.json({
      message: "Product delete successfully",
    });
  });
}
