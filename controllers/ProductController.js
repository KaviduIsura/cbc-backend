import Product from "../models/Product.js";
import { isAdmin } from "./UserController.js";

// Create new product
export async function createProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to add products!",
      });
    }

    const productData = req.body;
    
    // Validate required fields
    if (!productData.productId || !productData.productName || !productData.price) {
      return res.status(400).json({
        message: "Product ID, name, and price are required"
      });
    }

    // Check if product already exists
    const existingProduct = await Product.findOne({ productId: productData.productId });
    if (existingProduct) {
      return res.status(409).json({
        message: "Product with this ID already exists"
      });
    }

    // Set lastPrice if not provided
    if (!productData.lastPrice) {
      productData.lastPrice = productData.price;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: product
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message
    });
  }
}

// Get all products with filters
export async function getProducts(req, res) {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice, 
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
      ...filters 
    } = req.query;

    // Build query
    let query = {};

    // Category filter
    if (category && category !== 'all') {
      query.category = category;
    }

    // Search filter
    if (search) {
      query.$or = [
        { productName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Price filter
    if (minPrice || maxPrice) {
      query.lastPrice = {};
      if (minPrice) query.lastPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.lastPrice.$lte = parseFloat(maxPrice);
    }

    // Other filters
    if (filters.benefits) {
      query.benefits = { $in: filters.benefits.split(',') };
    }
    if (filters.skinType) {
      query.skinType = { $in: filters.skinType.split(',') };
    }
    if (filters.scentFamily) {
      query.scentFamily = { $in: filters.scentFamily.split(',') };
    }
    if (filters.isNew) {
      query.isNew = filters.isNew === 'true';
    }
    if (filters.isBestSeller) {
      query.isBestSeller = filters.isBestSeller === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Determine sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .select('-__v'); // Exclude version key

    res.json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        ...filters
      }
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      message: "Error retrieving products",
      error: error.message
    });
  }
}

// Get product by ID or MongoDB _id
export async function getProductById(req, res) {
  try {
    const { productId } = req.params;
    
    // Check if the ID is a MongoDB ObjectId (24 hex characters)
    const isMongoId = /^[0-9a-fA-F]{24}$/.test(productId);
    
    let product;
    if (isMongoId) {
      // If it's a MongoDB _id, look up by _id
      product = await Product.findById(productId);
    } else {
      // Otherwise, look up by productId field
      product = await Product.findOne({ productId: productId });
    }

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product retrieved successfully",
      product
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      message: "Error retrieving product",
      error: error.message
    });
  }
}

// Update product
export async function updateProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to update products",
      });
    }

    const productId = req.params.productId;
    const updateData = req.body;

    // Don't allow updating productId
    if (updateData.productId) {
      delete updateData.productId;
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { productId: productId },
      { ...updateData, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message
    });
  }
}

// Delete product
export async function deleteProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to delete products",
      });
    }

    const productId = req.params.productId;
    const deletedProduct = await Product.findOneAndDelete({ productId: productId });

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    res.json({
      message: "Product deleted successfully"
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message
    });
  }
}

// Get product categories with counts
export async function getProductCategories(req, res) {
  try {
    const categories = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { category: 1 }
      }
    ]);

    // Add 'all' category
    const total = await Product.countDocuments();
    categories.unshift({
      category: 'all',
      count: total
    });

    res.json({
      message: "Categories retrieved successfully",
      categories
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      message: "Error retrieving categories",
      error: error.message
    });
  }
}

// Get featured products
export async function getFeaturedProducts(req, res) {
  try {
    const products = await Product.find({
      $or: [
        { isBestSeller: true },
        { isNew: true },
        { rating: { $gte: 4.5 } }
      ]
    })
    .sort({ rating: -1, createdAt: -1 })
    .limit(8);

    res.json({
      message: "Featured products retrieved successfully",
      products
    });
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      message: "Error retrieving featured products",
      error: error.message
    });
  }
}