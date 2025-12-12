// models/User.js - Updated version
import mongoose from "mongoose";

const userSchema = mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  isBlocked: {
    type: Boolean,
    default: false,
  },
  type: {
    required: true,
    type: String,
    default: "customer",
    enum: ["customer", "admin", "staff"],
  },
  profilePic: {
    type: String,
    default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png",
  },
  // Admin specific fields
  isSuperAdmin: {
    type: Boolean,
    default: false,
  },
  permissions: [{
    type: String,
    enum: [
      "manage_products",
      "manage_orders",
      "manage_customers",
      "manage_admins",
      "manage_reviews",
      "view_analytics",
      "manage_settings",
      "manage_promotions",
      "manage_categories"
    ]
  }],
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
  },
  statusNotes: [{
    date: {
      type: Date,
      default: Date.now,
    },
    action: String,
    reason: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }
  }],
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
}, {
  timestamps: true,
});

// Register the model with the proper name
const User = mongoose.model("User", userSchema);
export default User;