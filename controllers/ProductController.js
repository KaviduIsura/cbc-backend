import Product from "../models/Product.js";
import Counter from "../models/Counter.js"; // Add this import
import { isAdmin } from "./UserController.js";

// Function to generate next product ID
async function getNextSequenceValue(sequenceName) {
  try {
    const sequenceDocument = await Counter.findOneAndUpdate(
      { _id: sequenceName },
      { $inc: { sequence_value: 1 } },
      { new: true, upsert: true }
    );
    return sequenceDocument.sequence_value;
  } catch (error) {
    console.error("Error getting sequence:", error);
    throw error;
  }
}

// Create new product with auto-generated ID
export async function createProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to add products!",
      });
    }

    const productData = req.body;

    // Remove productId from request if provided (we'll generate it)
    delete productData.productId;

    // Validate required fields
    if (!productData.productName || !productData.price) {
      return res.status(400).json({
        message: "Product name and price are required",
      });
    }

    // Generate auto-incremented product ID
    const sequenceValue = await getNextSequenceValue("productId");
    const productId = `PRD${String(sequenceValue).padStart(4, "0")}`;

    // Add auto-generated productId to productData
    productData.productId = productId;

    // Set lastPrice if not provided
    if (!productData.lastPrice) {
      productData.lastPrice = productData.price;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      message: "Product created successfully",
      product: product,
    });
  } catch (error) {
    console.error("Create product error:", error);
    res.status(500).json({
      message: "Error creating product",
      error: error.message,
    });
  }
}

// Get all products with filters - UPDATED to handle auto-generated IDs
// In your ProductController.js - update getProducts function

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
      limit = 12, // Default to 12 products per page
      benefits,
      skinType,
      scentFamily,
      isNew,
      isBestSeller
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
        { productId: { $regex: search, $options: 'i' } },
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
    if (benefits) {
      query.benefits = { $in: benefits.split(',') };
    }
    if (skinType) {
      query.skinType = { $in: skinType.split(',') };
    }
    if (scentFamily) {
      query.scentFamily = { $in: scentFamily.split(',') };
    }
    if (isNew) {
      query.isNew = isNew === 'true';
    }
    if (isBestSeller) {
      query.isBestSeller = isBestSeller === 'true';
    }

    // Calculate pagination
    const currentPage = Math.max(parseInt(page), 1);
    const limitValue = Math.min(Math.max(parseInt(limit), 1), 100); // Max 100 per page
    const skip = (currentPage - 1) * limitValue;
    
    // Get total count for pagination
    const total = await Product.countDocuments(query);
    
    // Determine sort
    const sort = {};
    
    // Map frontend sort values to database fields
    let sortField = sortBy;
    if (sortBy === 'price-low' || sortBy === 'price-high') {
      sortField = 'lastPrice';
    } else if (sortBy === 'featured') {
      sortField = 'isBestSeller';
    } else if (sortBy === 'rating') {
      sortField = 'rating';
    } else if (sortBy === 'newest') {
      sortField = 'createdAt';
    }
    
    sort[sortField] = sortOrder === 'desc' ? -1 : 1;
    
    // For price-low, we want ascending order
    if (sortBy === 'price-low') {
      sort[sortField] = 1;
    }

    // Execute query
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitValue)
      .select('-__v');

    const totalPages = Math.ceil(total / limitValue);

    res.json({
      message: "Products retrieved successfully",
      products,
      pagination: {
        total,
        page: currentPage,
        limit: limitValue,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        nextPage: currentPage < totalPages ? currentPage + 1 : null,
        prevPage: currentPage > 1 ? currentPage - 1 : null
      },
      filters: {
        category,
        search,
        minPrice,
        maxPrice,
        benefits,
        skinType,
        scentFamily,
        sortBy,
        sortOrder
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

// Get product by auto-generated ID or MongoDB _id
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
      // Otherwise, look up by auto-generated productId field
      product = await Product.findOne({ productId: productId });
    }

    if (!product) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product retrieved successfully",
      product,
    });
  } catch (error) {
    console.error("Get product by ID error:", error);
    res.status(500).json({
      message: "Error retrieving product",
      error: error.message,
    });
  }
}

// Update product - UPDATED to prevent changing auto-generated ID
export async function updateProduct(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator to update products",
      });
    }

    const productId = req.params.productId;
    const updateData = req.body;

    // Don't allow updating productId (it's auto-generated and should be immutable)
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
        message: "Product not found",
      });
    }

    res.json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
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
    const deletedProduct = await Product.findOneAndDelete({
      productId: productId,
    });

    if (!deletedProduct) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
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
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          category: "$_id",
          count: 1,
          _id: 0,
        },
      },
      {
        $sort: { category: 1 },
      },
    ]);

    // Add 'all' category
    const total = await Product.countDocuments();
    categories.unshift({
      category: "all",
      count: total,
    });

    res.json({
      message: "Categories retrieved successfully",
      categories,
    });
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({
      message: "Error retrieving categories",
      error: error.message,
    });
  }
}

// Get featured products
export async function getFeaturedProducts(req, res) {
  try {
    const products = await Product.find({
      $or: [{ isBestSeller: true }, { isNew: true }, { rating: { $gte: 4.5 } }],
    })
      .sort({ rating: -1, createdAt: -1 })
      .limit(8);

    res.json({
      message: "Featured products retrieved successfully",
      products,
    });
  } catch (error) {
    console.error("Get featured products error:", error);
    res.status(500).json({
      message: "Error retrieving featured products",
      error: error.message,
    });
  }
}

// Get next available product ID (for frontend if needed)
export async function getNextProductId(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({
        message: "Please login as administrator",
      });
    }

    const sequenceValue = await getNextSequenceValue("productId");
    const nextProductId = `PRD${String(sequenceValue).padStart(4, "0")}`;

    res.json({
      message: "Next product ID retrieved successfully",
      nextProductId,
      sequenceValue,
    });
  } catch (error) {
    console.error("Get next product ID error:", error);
    res.status(500).json({
      message: "Error retrieving next product ID",
      error: error.message,
    });
  }
}
