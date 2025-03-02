const Razorpay = require('razorpay');
const Order = require('../models/Order.model');
const User = require('../models/User.model');
const GoldProduct = require('../models/GoldProduct.model');
const GoldPriceService = require('../services/goldPriceService');
const mongoose = require('mongoose'); 
const crypto = require('crypto');
// Initialize Razorpay instance with your credentials
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,  // Set your Razorpay key ID here
    key_secret: process.env.RAZORPAY_KEY_SECRET // Set your Razorpay key secret here
});
const verifyPaymentStatus = async (paymentId) => {
    try {
        const payment = await razorpay.payments.fetch(paymentId);
        return payment;
    } catch (error) {
        console.error('🔥 Razorpay payment verification error:', error);
        throw new Error('Unable to verify payment status');
    }
};
// Create a new order with Razorpay integration


const createOrder = async (req, res) => {
    try {
        const { userId, products, totalAmount, shippingAddress, paymentMethod } = req.body;

        if (req.user._id && req.user._id.toString() !== userId) {
            return res.status(403).json({ message: 'You are not authorized to create this order' });
        }

        // Validate if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let calculatedTotal = 0;
        for (const item of products) {
            const product = await GoldProduct.findById(item.productId);
            if (!product || !product.isAvailable) {
                return res.status(400).json({ message: `Product not available: ${item.productId}` });
            }

            const latestPrice = product.discountedPrice;
            const cartPrice = item.price;
            if (Math.abs(latestPrice - cartPrice) / cartPrice > 0.05) {
                return res.status(400).json({ message: `Price changed for ${product.name}` });
            }

            calculatedTotal += latestPrice * item.quantity;
        }

        if (Math.abs(calculatedTotal - totalAmount) > 1) {
            return res.status(400).json({ message: 'Order total mismatch' });
        }

        const newOrder = new Order({
            userId,
            products: products.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.price,
                karatAtPurchase: item.karat,
                weightAtPurchase: item.weight
            })),
            totalAmount,
            shippingAddress,
            orderDate: new Date(),
            status: paymentMethod === 'COD' ? 'ORDER PLACED' : 'Created', // Initial status based on payment method
            paymentMethod,
            goldPriceAtPurchase: await GoldPriceService.fetchGoldPrice(),
            orderStatus: paymentMethod === 'ONLINE' ? 'Paid' : 'OrderPlaced', // Set order status for online payment
        });

        await newOrder.save();

        if (paymentMethod === 'ONLINE') {
            const razorpayOrder = await razorpay.orders.create({
                amount: totalAmount * 100,
                currency: 'INR',
                receipt: `order_receipt_${newOrder._id}`,
                payment_capture: 1
            });

            if (!razorpayOrder) {
                return res.status(500).json({ message: 'Failed to create Razorpay order' });
            }

            newOrder.razorpayOrderId = razorpayOrder.id;
            newOrder.razorpayOrderDetails = razorpayOrder;
            await newOrder.save();
        }

        res.status(201).json({
            message: 'Order created successfully',
            order: newOrder,
            razorpayOrder: paymentMethod === 'ONLINE' ? newOrder.razorpayOrderDetails : null
        });

    } catch (error) {
        console.error('🔥 Order creation error:', error);
        res.status(500).json({ message: 'Error creating order', error: error.message });
    }
};

// Confirm Razorpay payment (Webhook handler)
const confirmPayment = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;

        // Verify the signature sent by Razorpay
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(orderId + "|" + paymentId)
            .digest('hex');

        if (generatedSignature !== signature) {
            return res.status(400).json({ message: 'Invalid signature' });
        }

        // Verify payment status using Razorpay API
        const paymentStatus = await verifyPaymentStatus(paymentId);

        if (!paymentStatus) {
            return res.status(400).json({ message: 'Unable to verify payment status' });
        }

        // If payment is pending, handle accordingly
        if (paymentStatus.status === 'pending') {
            return res.status(200).json({ message: 'Payment is pending. Please try again later' });
        }

        // Find order and update payment status
        const order = await Order.findOne({ razorpayOrderId:orderId});
        
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If the payment is successful, update the order status
        if (paymentStatus.status === 'captured') {
            order.status = 'paid';
            order.paymentDetails = {
                paymentId,
                orderId,
                signature
            };
            await order.save();

            res.status(200).json({ message: 'Payment successfully confirmed', order });
        } else {
            res.status(400).json({ message: 'Payment failed or cancelled' });
        }
    } catch (error) {
        console.error('🔥 Payment confirmation error:', error);
        res.status(500).json({
            message: 'Error confirming payment',
            error: error.message
        });
    }
};

// Get all orders with detailed product information
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email phone')
            .populate('products.productId', 'name category karat weight images')
            .sort({ orderDate: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders', error: error.message });
    }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('products.productId', 'name category karat weight images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order', error: error.message });
    }
};

// Update an order
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Only allow status updates

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('userId products.productId');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order is cancelled, restore product stock
        if (status === 'cancelled') {
            for (const item of updatedOrder.products) {
                await GoldProduct.findByIdAndUpdate(item.productId, {
                    inStock: true
                });
            }
        }

        res.status(200).json({ 
            message: 'Order updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating order', 
            error: error.message 
        });
    }
};

// Delete an order (soft delete recommended for orders)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Soft delete by updating status
        order.status = 'deleted';
        order.deletedAt = new Date();
        await order.save();

        // Restore product stock
        for (const item of order.products) {
            await GoldProduct.findByIdAndUpdate(item.productId, {
                inStock: true
            });
        }

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting order', 
            error: error.message 
        });
    }
};

// Get orders by user ID
const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;

        // Ensure userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: 'Invalid user ID format' });
        }

        const orders = await Order.find({ userId: new mongoose.Types.ObjectId(userId) })
            .populate('products.productId', 'name category karat weight images')
            .sort({ createdAt: -1 });

        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found for this user' });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user orders', 
            error: error.message 
        });
    }
};

module.exports = {
    createOrder,
    confirmPayment,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByUser
};
