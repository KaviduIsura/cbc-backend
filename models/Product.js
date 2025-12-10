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
  name: {
    type: String,
    required: true,
  },
  altNames: [
    {
      type: String,
    },
  ],
  category: {
    type: String,
    required: true,
    enum: ['perfumes', 'skincare', 'makeup', 'tools', 'all'],
    default: 'all'
  },
  images: [
    {
      type: String,
    },
  ],
  price: {
    type: Number,
    required: true,
  },
  originalPrice: {
    type: Number,
  },
  lastPrice: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  detailedDescription: {
    type: String,
  },
  stock: {
    type: Number,
    required: true,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isNew: {
    type: Boolean,
    default: false
  },
  isBestSeller: {
    type: Boolean,
    default: false
  },
  features: [{
    type: String
  }],
  benefits: [{
    type: String,
    enum: ['hydrating', 'anti-aging', 'brightening', 'soothing', 'calming', 'energizing']
  }],
  skinType: [{
    type: String,
    enum: ['dry', 'oily', 'combination', 'sensitive', 'normal']
  }],
  scentFamily: [{
    type: String,
    enum: ['woody', 'floral', 'oriental', 'fresh', 'spicy']
  }],
  tags: [{
    type: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Product = mongoose.model("Product", productSchema);
export default Product;