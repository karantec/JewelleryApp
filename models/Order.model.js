const mongoose = require('mongoose');

// Define the Order schema
const orderSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', // Reference to the User model
        required: true 
    },
    products: [{
        productId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'GoldProduct', // Reference to the GoldProduct model
            required: true 
        },
        quantity: { 
            type: Number, 
            required: true, 
            min: 1 
        },
    }],
    totalAmount: { 
        type: Number, 
        required: true 
    },
    orderStatus: { 
        type: String, 
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'], 
        default: 'Pending' 
    },
    shippingAddress: {
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
