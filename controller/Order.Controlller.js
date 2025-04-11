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
    const { shippingAddress, paymentMethod, cartId } = req.body;

    if (!userId) {
      return res.status(403).json({ message: 'User authentication failed' });
    }

    const cart = await Cart.findOne({ _id: cartId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        return res.status(400).json({
          message: `Invalid product: ${item?.productId || 'unknown'}`,
        });
      }

      // ✅ Get the latest price per product
      const priceDetails = await product.getCurrentPrice();
      const latestBasePrice = parseFloat(priceDetails.currentTotalPrice);
      if (isNaN(latestBasePrice)) {
        return res.status(400).json({ message: 'Unable to get latest product price' });
      }

      // ✅ Add 3% GST
      const priceWithGST = +(latestBasePrice * 1.03).toFixed(2);

      // ✅ Multiply by quantity
      const totalItemPrice = +(priceWithGST * item.quantity).toFixed(2);

      totalAmount += totalItemPrice;

      // ✅ Push item with snapshot to order items array
      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtTimeOfAdding: priceWithGST,
        productSnapshot: {
          name: product.name,
          description: product.description,
          category: product.category,
          image: product.image,
          // Add more fields as needed
        },
      });
    }

    const newOrderData = {
      userId,
      cartId: cart._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending' : 'Pending',
      orderStatus: paymentMethod === 'COD' ? 'ORDER PLACED' : 'Created',
      orderDate: new Date(),
    };

    // ✅ Handle Razorpay order creation
    if (paymentMethod === 'ONLINE') {
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // in paisa
        currency: 'INR',
        receipt: `order_rcptid_${cart._id}`,
        payment_capture: 1,
      });

      newOrderData.razorpay = {
        orderId: razorpayOrder.id,
        orderDetails: razorpayOrder,
      };
    }

    const newOrder = new Order(newOrderData);
    await newOrder.save();

    // ✅ Mark all products as unavailable
    for (const item of cart.items) {
      await GoldProduct.findByIdAndUpdate(item.productId._id, {
        isAvailable: false,
      });
    }

    // ✅ Clear cart
    await Cart.findByIdAndUpdate(cartId, { $set: { items: [] } });

    res.status(201).json({
      message: 'Order created successfully',
      order: newOrder,
      razorpayOrder: newOrder.razorpay?.orderDetails || null,
    });
  } catch (error) {
    console.error('🔥 Error creating order:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};


const getOrdersByUser = async (req, res) => {
  try {
    const { _id: userId } = req.user || {};

    const orders = await Order.find({ userId })
      .populate({
        path: 'cartId',
        populate: {
          path: 'items.productId',
          model: 'GoldProduct'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("🔥 Error in getOrdersByUser:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'cartId',
        populate: {
          path: 'items.productId',
          model: 'GoldProduct'
        }
      });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (error) {
    console.error("🔥 Error in getOrderById:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate({
        path: 'cartId',
        populate: {
          path: 'items.productId',
          model: 'GoldProduct'
        }
      })
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("🔥 Error in getAllOrders:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};




module.exports = { createOrder ,getOrdersByUser,getOrderById,getAllOrders};
