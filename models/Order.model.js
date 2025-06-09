const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    cartId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cart",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "GoldProduct",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        priceAtTimeOfAdding: {
          type: Number,
          required: true,
        },
        productSnapshot: {
          name: String,
          description: String,
          category: String,
          image: String,
          // add any other relevant fields from your GoldProduct model
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      fullName: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phone: { type: String },
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      required: true,
      default: "COD",
    },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Failed", "Refunded"],
      default: "Pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "Created",
        "ORDER PLACED",
        "Shipped",
        "Delivered",
        "Cancelled",
        "Deleted",
      ],
      default: "Created",
    },
    // 🆕 Cashfree payment gateway fields
    cashfree: {
      orderId: { type: String }, // Your custom order ID
      cfOrderId: { type: String }, // Cashfree's order ID
      paymentSessionId: { type: String }, // Payment session ID for frontend
      paymentId: { type: String }, // Payment ID after successful payment
      signature: { type: String }, // Payment signature for verification
      orderDetails: { type: Object }, // Complete order response from Cashfree
      paymentDetails: { type: Object }, // Payment details after completion
      webhookData: { type: Object }, // Webhook response data
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Index for better query performance
orderSchema.index({ userId: 1, orderDate: -1 });
orderSchema.index({ "cashfree.orderId": 1 });
orderSchema.index({ "cashfree.cfOrderId": 1 });

// ✅ Method to get payment gateway data
orderSchema.methods.getPaymentGatewayData = function () {
  if (this.paymentMethod === "ONLINE") {
    return this.cashfree || null;
  }
  return null;
};

// ✅ Method to check if order is paid
orderSchema.methods.isPaid = function () {
  return this.paymentStatus === "Paid";
};

// ✅ Method to check if payment is pending
orderSchema.methods.isPaymentPending = function () {
  return this.paymentMethod === "ONLINE" && this.paymentStatus === "Pending";
};

module.exports = mongoose.model("Order", orderSchema);
