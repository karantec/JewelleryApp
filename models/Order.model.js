const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cart',
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },

  shippingAddress: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String, required: true }
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE'],
    required: true,
    default: 'COD'
  },

  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
    default: 'Pending'
  },

  orderStatus: {
    type: String,
    enum: ['Created', 'ORDER PLACED', 'Shipped', 'Delivered', 'Cancelled', 'Deleted'],
    default: 'Created'
  },

  razorpay: {
    orderId: { type: String },
    paymentId: { type: String },
    signature: { type: String },
    orderDetails: { type: Object }
  },

  orderDate: {
    type: Date,
    default: Date.now
  },

  deletedAt: {
    type: Date,
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
