const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GoldProduct',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Paid'],
        default: 'Pending'
    },
    shippingAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String },
        state: { type: String },
        zipCode: { type: String },
        country: { type: String },
    },
    razorpayOrderId: {
        type: String,
    },
    paymentId: {
        type: String,
    },
    paymentSignature: {
        type: String,
    },
    razorpayOrderDetails: {  // This will store full Razorpay order details
        type: Object
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
