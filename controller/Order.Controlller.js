const Razorpay = require('razorpay');
const Order = require('../models/Order.model');
const Cart = require('../models/Cart.model');
const GoldProduct = require('../models/GoldProduct.model');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// 🔹 Create Order
const createOrder = async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    const { shippingAddress, paymentMethod } = req.body;

    if (!userId) {
      return res.status(403).json({ message: 'User authentication failed' });
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const products = [];

    for (const item of cart.items) {
      const product = item.productId;

      if (!product || !product.isAvailable) {
        return res.status(400).json({
          message: `Invalid or unavailable product: ${product?._id || 'unknown'}`,
        });
      }

      products.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtTimeOfAdding: item.priceAtTimeOfAdding,
      });

      totalAmount += item.priceAtTimeOfAdding * item.quantity;
    }

    const newOrder = new Order({
      userId,
      products,
      shippingAddress,
      paymentMethod,
      status: paymentMethod === 'COD' ? 'ORDER PLACED' : 'Created',
      orderDate: new Date(),
    });

    if (paymentMethod === 'ONLINE') {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paisa
        currency: 'INR',
        receipt: `order_rcptid_${newOrder._id}`,
        payment_capture: 1,
      });

      newOrder.razorpayOrderId = razorpayOrder.id;
      newOrder.razorpayOrderDetails = razorpayOrder;
    }

    await newOrder.save();

    // Mark products as unavailable
    for (const item of products) {
      await GoldProduct.findByIdAndUpdate(item.productId, {
        isAvailable: false,
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } });

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
      razorpayOrder: newOrder.razorpayOrderDetails || null,
    });
  } catch (error) {
    console.error('🔥 Error creating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = { createOrder };
