import mongoose, { Schema } from "mongoose";

const productSchema = mongoose.Schema({
  productId: {
    type: String,
    required: true,
    unique: true,
  },
  productName: {
    type: String,
    required: true,
  },
  altNames: [
    {
      type: String,
    },
  ],
  images: [
    {
      type: String,
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  lastPrice: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
});

const Product = mongoose.model("products", productSchema);
export default Product;