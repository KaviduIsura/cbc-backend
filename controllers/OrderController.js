import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import User from "../models/User.js";

// Helper functions from UserController
export function isAdmin(req) {
  return req.user && req.user.type === "admin";
}

export function isCustomer(req) {
  return req.user && req.user.type === "customer";
}

export async function createOrder(req, res) {
  try {
    // Check if user is logged in as customer
    if (!isCustomer(req)) {
      return res.status(401).json({
        success: false,
        message: "Please login as customer to create orders"
      });
    }

    // Generate order ID
    const orderId = await Order.generateOrderId();

    // Prepare order data from request
    const {
      shippingInfo,
      paymentMethod,
      deliveryMethod,
      giftMessage,
      orderNotes,
      items,
      subtotal,
      shipping,
      tax,
      discount,
      codFee = 0,
      total,
    } = req.body;

    // Validate required fields
    if (!shippingInfo || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Shipping information and items are required"
      });
    }

    // Prepare ordered items
    const orderedItems = await Promise.all(
      items.map(async (item) => {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          throw new Error(`Product with id ${item.productId} not found`);
        }

        return {
          productId: item.productId,
          name: item.name || product.name || product.productName,
          image: item.image || (product.images && product.images[0]) || "",
          quantity: item.quantity,
          price: item.price || product.price || product.lastPrice,
        };
      })
    );

    // Set status based on payment method
    let status = "preparing";
    if (paymentMethod === 'cod') {
      status = "pending_payment";
    }

    // Create new order
    const newOrder = new Order({
      orderId,
      email: req.user.email,
      userId: req.user._id,
      orderedItems,
      shippingInfo,
      paymentMethod,
      deliveryMethod,
      giftMessage,
      orderNotes,
      subtotal: parseFloat(subtotal) || 0,
      shipping: parseFloat(shipping) || 0,
      tax: parseFloat(tax) || 0,
      discount: parseFloat(discount) || 0,
      codFee: parseFloat(codFee) || 0,
      total: parseFloat(total) || 0,
      status,
      isPaid: paymentMethod !== 'cod', // COD orders are not paid initially
      notes: orderNotes,
      name: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
      address: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} ${shippingInfo.zipCode}, ${shippingInfo.country}`,
      phone: shippingInfo.phone,
    });

    // Save order
    const savedOrder = await newOrder.save();

    // Clear user's cart after successful order
    await Cart.findOneAndUpdate(
      { userId: req.user._id },
      { items: [], total: 0 },
      { new: true }
    );

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: {
        _id: savedOrder._id,
        orderId: savedOrder.orderId,
        status: savedOrder.status,
        total: savedOrder.total,
        paymentMethod: savedOrder.paymentMethod,
        deliveryMethod: savedOrder.deliveryMethod,
        createdAt: savedOrder.createdAt,
      },
      orderDetails: savedOrder
    });

  } catch (error) {
    console.error("Create order error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function getOrders(req, res) {
  try {
    // Check if user is logged in
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login to view orders"
      });
    }

    let orders;
    
    if (isAdmin(req)) {
      // Admin can see all orders
      orders = await Order.find({})
        .sort({ createdAt: -1 })
        .select('orderId status total paymentMethod deliveryMethod createdAt shippingInfo email isPaid orderedItems')
        .lean();
    } else if (isCustomer(req)) {
      // Customer can only see their own orders
      orders = await Order.find({ 
        $or: [
          { email: req.user.email },
          { userId: req.user._id }
        ]
      })
      .sort({ createdAt: -1 })
      .select('orderId status total paymentMethod deliveryMethod createdAt shippingInfo email isPaid orderedItems')
      .lean();
    } else {
      return res.status(403).json({
        success: false,
        message: "Access denied"
      });
    }

    // Format orders for frontend
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      orderId: order.orderId,
      status: order.status,
      total: order.total,
      paymentMethod: order.paymentMethod,
      deliveryMethod: order.deliveryMethod,
      createdAt: order.createdAt,
      itemsCount: order.orderedItems?.length || 0,
      customerName: order.shippingInfo ? 
        `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}` : 
        'Unknown Customer',
      email: order.email || order.shippingInfo?.email,
      isPaid: order.isPaid,
      shippingInfo: order.shippingInfo || null
    }));

    res.json({
      success: true,
      count: formattedOrders.length,
      orders: formattedOrders
    });

  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve orders",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please login to view order details"
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Check permissions
    const isOwner = order.email === req.user.email || 
                    order.userId?.toString() === req.user._id?.toString();
    
    if (!isAdmin(req) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders."
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error("Get order by id error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve order",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}


export async function getQuote(req, res) {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items array is required"
      });
    }

    const newProductArray = [];
    let total = 0;
    let labelTotal = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product with id ${item.productId} not found`
        });
      }

      const productPrice = product.lastPrice || product.price || 0;
      const productLabelPrice = product.price || 0;
      const quantity = item.quantity || 1;

      labelTotal += productLabelPrice * quantity;
      total += productPrice * quantity;

      newProductArray.push({
        productId: product._id,
        name: product.productName || product.name,
        price: productPrice,
        labelPrice: productLabelPrice,
        quantity: quantity,
        image: product.images && product.images[0] ? product.images[0] : "",
      });
    }

    res.json({
      success: true,
      orderedItems: newProductArray,
      total: total,
      labelTotal: labelTotal,
    });

  } catch (error) {
    console.error("Get quote error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to calculate quote",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function getUserOrders(req, res) {
  try {
    if (!isCustomer(req)) {
      return res.status(401).json({
        success: false,
        message: "Please login as customer to view your orders"
      });
    }

    const orders = await Order.find({ 
      $or: [
        { email: req.user.email },
        { userId: req.user._id }
      ]
    })
    .sort({ createdAt: -1 })
    .select('-paymentInfo -shippingInfo.apartment -shippingInfo.saveInfo');

    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });

  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve user orders",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export async function markAsPaid(req, res) {
  try {
    const { id } = req.params;

    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { 
        isPaid: true,
        paidAt: Date.now(),
        status: 'preparing',
        updatedAt: Date.now()
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    res.json({
      success: true,
      message: "Order marked as paid",
      order: {
        _id: order._id,
        orderId: order.orderId,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        status: order.status
      }
    });

  } catch (error) {
    console.error("Mark as paid error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark order as paid",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
// controllers/OrderController.js - Update the updateOrderStatus function
export async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Check if user is admin
    if (!isAdmin(req)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admin only."
      });
    }

    // Validate status
    const validStatuses = ['pending', 'pending_payment', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Valid statuses are: " + validStatuses.join(', ')
      });
    }

    // Find the order first
    const order = await Order.findById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Update order status
    const updateData = {
      status,
      updatedAt: Date.now()
    };

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Update payment status if order is delivered
    if (status === 'delivered') {
      updateData.isPaid = true;
      updateData.paidAt = Date.now();
    }

    // Mark as paid if status is preparing and payment was pending
    if (status === 'preparing' && order.paymentMethod === 'cod' && !order.isPaid) {
      updateData.isPaid = true;
      updateData.paidAt = Date.now();
    }

    // Save the updated order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: {
        _id: updatedOrder._id,
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        updatedAt: updatedOrder.updatedAt,
        isPaid: updatedOrder.isPaid,
        notes: updatedOrder.notes
      }
    });

  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}