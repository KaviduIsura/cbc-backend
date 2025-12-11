// controllers/WishlistController.js
import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// Helper function to find product by either _id or productId
const findProduct = async (productId) => {
  // Check if it's a valid MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(productId);
  
  if (isObjectId) {
    // Try to find by MongoDB _id
    return await Product.findById(productId);
  } else {
    // Try to find by custom productId field
    return await Product.findOne({ productId: productId });
  }
};

// Get user's wishlist
export async function getWishlist(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id })
      .populate({
        path: 'items.product',
        select: 'productId productName name category price originalPrice lastPrice images rating stock isNew isBestSeller features benefits skinType scentFamily tags'
      });

    if (!wishlist) {
      return res.json({
        success: true,
        message: "Wishlist is empty",
        wishlist: { items: [], user: req.user._id }
      });
    }

    res.json({
      success: true,
      message: "Wishlist retrieved successfully",
      wishlist
    });
  } catch (error) {
    console.error("Get wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error retrieving wishlist",
      error: error.message
    });
  }
}

// Add item to wishlist
export async function addToWishlist(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Check if product exists using helper function
    const product = await findProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    // Find user's wishlist or create one
    let wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      wishlist = new Wishlist({
        user: req.user._id,
        items: []
      });
    }

    // Check if product is already in wishlist
    // Use product._id for comparison since wishlist stores MongoDB ObjectIds
    const existingItemIndex = wishlist.items.findIndex(
      item => item.product.toString() === product._id.toString()
    );

    if (existingItemIndex !== -1) {
      return res.status(400).json({
        success: false,
        message: "Product already in wishlist"
      });
    }

    // Add product to wishlist - store the MongoDB _id
    wishlist.items.push({
      product: product._id,
      addedAt: Date.now()
    });

    await wishlist.save();

    // Populate product details for response
    await wishlist.populate({
      path: 'items.product',
      select: 'productId productName name category price originalPrice lastPrice images rating stock isNew isBestSeller'
    });

    res.json({
      success: true,
      message: "Product added to wishlist",
      wishlist
    });
  } catch (error) {
    console.error("Add to wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error adding to wishlist",
      error: error.message
    });
  }
}

// Remove item from wishlist
export async function removeFromWishlist(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required"
      });
    }

    // Find the product using helper function
    const product = await findProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    // Remove product from wishlist - use product._id for comparison
    wishlist.items = wishlist.items.filter(
      item => item.product.toString() !== product._id.toString()
    );

    await wishlist.save();

    // Populate before sending response
    await wishlist.populate({
      path: 'items.product',
      select: 'productId productName name category price originalPrice lastPrice images'
    });

    res.json({
      success: true,
      message: "Product removed from wishlist",
      wishlist
    });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error removing from wishlist",
      error: error.message
    });
  }
}

// Clear entire wishlist
export async function clearWishlist(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Wishlist not found"
      });
    }

    wishlist.items = [];
    await wishlist.save();

    res.json({
      success: true,
      message: "Wishlist cleared successfully",
      wishlist
    });
  } catch (error) {
    console.error("Clear wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error clearing wishlist",
      error: error.message
    });
  }
}

// Check if product is in wishlist
export async function checkInWishlist(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const { productId } = req.params;

    // Find the product using helper function
    const product = await findProduct(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    const wishlist = await Wishlist.findOne({ 
      user: req.user._id,
      'items.product': product._id
    });

    res.json({
      success: true,
      isInWishlist: !!wishlist,
      productId: product.productId || product._id
    });
  } catch (error) {
    console.error("Check wishlist error:", error);
    res.status(500).json({
      success: false,
      message: "Error checking wishlist",
      error: error.message
    });
  }
}

// Get wishlist count
export async function getWishlistCount(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    const count = wishlist ? wishlist.items.length : 0;

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error("Get wishlist count error:", error);
    res.status(500).json({
      success: false,
      message: "Error getting wishlist count",
      error: error.message
    });
  }
}