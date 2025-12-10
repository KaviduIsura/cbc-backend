// controllers/cartController.js
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

// Get user's cart
export const getCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please login to view cart" });
    }

    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId');
    
    if (!cart) {
      // Create empty cart if doesn't exist
      cart = new Cart({
        userId: req.user._id,
        items: [],
        total: 0
      });
      await cart.save();
    }

    // Calculate total
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    await cart.save();

    res.json({
      message: "Cart retrieved successfully",
      cart
    });
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Error retrieving cart", error: error.message });
  }
};

// Add item to cart
export const addToCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please login to add items to cart" });
    }

    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [], total: 0 });
    }

    // Check if product already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.productId.toString() === productId
    );

    if (existingItemIndex > -1) {
      // Update quantity
      cart.items[existingItemIndex].quantity += quantity;
      
      // Check stock again with updated quantity
      if (product.stock < cart.items[existingItemIndex].quantity) {
        return res.status(400).json({ 
          message: `Cannot add more items. Only ${product.stock} available in stock` 
        });
      }
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        price: product.lastPrice || product.price,
        name: product.productName || product.name,
        image: product.images?.[0] || '',
        category: product.category,
        originalPrice: product.originalPrice,
        lastPrice: product.lastPrice
      });
    }

    // Calculate total
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    cart.updatedAt = Date.now();
    await cart.save();

    res.json({
      message: "Item added to cart successfully",
      cart
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Error adding item to cart", error: error.message });
  }
};

// Update item quantity
export const updateCartItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please login to update cart" });
    }

    const { itemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Valid quantity is required" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      item => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Get product to check stock
    const product = await Product.findById(cart.items[itemIndex].productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${product.stock} items available in stock` 
      });
    }

    cart.items[itemIndex].quantity = quantity;
    cart.total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    cart.updatedAt = Date.now();
    await cart.save();

    res.json({
      message: "Cart updated successfully",
      cart
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Error updating cart", error: error.message });
  }
};

// Remove item from cart
export const removeCartItem = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please login to remove items from cart" });
    }

    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    cart.total = cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    cart.updatedAt = Date.now();
    await cart.save();

    res.json({
      message: "Item removed from cart successfully",
      cart
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    res.status(500).json({ message: "Error removing item from cart", error: error.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Please login to clear cart" });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    cart.total = 0;
    cart.updatedAt = Date.now();
    await cart.save();

    res.json({
      message: "Cart cleared successfully",
      cart
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Error clearing cart", error: error.message });
  }
};

// Get cart count
export const getCartCount = async (req, res) => {
  try {
    if (!req.user) {
      return res.json({ count: 0 });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      return res.json({ count: 0 });
    }

    const count = cart.items.reduce((total, item) => total + item.quantity, 0);
    
    res.json({
      count
    });
  } catch (error) {
    console.error("Get cart count error:", error);
    res.json({ count: 0 });
  }
};