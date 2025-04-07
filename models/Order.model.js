const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  products: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoldProduct',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      },
      priceAtTimeOfAdding: {
        type: Number,
        required: true
      }
    }
  ],

  shippingAddress: {
    fullName: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    phone: String
  },

  paymentMethod: {
    type: String,
    enum: ['COD', 'ONLINE'],
    default: 'COD'
  },

  status: {
    type: String,
    enum: ['Created', 'ORDER PLACED', 'Paid', 'Shipped', 'Delivered', 'Cancelled', 'Deleted'],
    default: 'Created'
  },

  razorpayOrderId: String,

  razorpayOrderDetails: Object,

  paymentDetails: {
    paymentId: String,
    orderId: String,
    signature: String
  },

  orderDate: {
    type: Date,
    default: Date.now
  },

  deletedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
