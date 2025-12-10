import mongoose from "mongoose";

const orderSchema = mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
  },
  orderedItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      name: {
        type: String,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  date: {
    type: Date,
    required: true,
    default: Date.now,
  },
  paymentId: {
    type: String,
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'pending_payment', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: "preparing",
  },
  notes: {
    type: String,
  },
  // Shipping Information
  shippingInfo: {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    apartment: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      default: "United States",
    },
  },
  // Payment Information
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'paypal', 'cod'],
    default: 'card',
  },
  paymentInfo: {
    cardNumber: {
      type: String,
    },
    cardName: {
      type: String,
    },
    expiryDate: {
      type: String,
    },
    cvv: {
      type: String,
    },
    saveCard: {
      type: Boolean,
      default: false,
    },
  },
  // Delivery Information
  deliveryMethod: {
    type: String,
    required: true,
    enum: ['standard', 'express', 'overnight', 'free'],
    default: 'standard',
  },
  // Order Summary
  subtotal: {
    type: Number,
    required: true,
    default: 0,
  },
  shipping: {
    type: Number,
    required: true,
    default: 0,
  },
  tax: {
    type: Number,
    required: true,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  codFee: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    default: 0,
  },
  // Additional Information
  giftMessage: {
    type: String,
  },
  orderNotes: {
    type: String,
  },
  // User who placed the order
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  // COD Specific
  isPaid: {
    type: Boolean,
    default: false,
  },
  paidAt: {
    type: Date,
  },
});

// Update the updatedAt field before saving
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to generate order ID
orderSchema.statics.generateOrderId = async function() {
  const latestOrder = await this.findOne().sort({ createdAt: -1 });
  
  if (!latestOrder) {
    return "ORD0001";
  }
  
  const currentOrderId = latestOrder.orderId;
  const numberString = currentOrderId.replace("ORD", "");
  const number = parseInt(numberString);
  const newNumber = (number + 1).toString().padStart(4, "0");
  return "ORD" + newNumber;
};

const Order = mongoose.model("Order", orderSchema);
export default Order;