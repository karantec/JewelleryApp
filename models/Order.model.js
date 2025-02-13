const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'GoldProduct',
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
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Paid'],
            default: 'Pending',
        },
        shippingAddress: { type: String, required: [true, 'Address Line is required'] },
        city: { type: String, required: [true, 'City is required'] },
        state: { type: String, required: [true, 'State is required'] },
        zipcode: { type: String, required: [true, 'Zipcode is required'] },
        country: { type: String, required: [true, 'Country is required'] },
        landmark: { type: String },
        primaryPhone: { type: String, required: [true, 'Primary Phone is required'] },
        secondaryPhone: { type: String },
        isDefault: { type: Boolean, default: false },
        razorpayOrderId: {
            type: String,
        },
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

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
