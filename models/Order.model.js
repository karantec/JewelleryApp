const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GoldProduct",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: [
        "Pending",
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Paid",
      ],
      default: "Pending",
    },
    shippingAddress: {
      addressLine: { type: String, required: true },
      city: { type: String },
      state: { type: String },
      landmark: { type: String },
      primaryPhone: { type: String },
      secondaryPhone: { type: String },
      zipCode: { type: String },
      country: { type: String },
      isDefault: { type: Boolean },
    },
    razorpayOrderId: {
      type: String,
    },
    paymentMethod: { type: String, enum: ['ONLINE', 'COD'], required: true },
    paymentId: {
      type: String,
    },
    paymentSignature: {
      type: String,
    },
    razorpayOrderDetails: {
      type: Object, // This will store full Razorpay order details
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
