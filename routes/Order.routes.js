// // routes/Order.routes.js
// const express = require('express');

// const { verifyToken, isAdmin } = require('../middleware/authmiddleware');
// const { createOrder, getOrdersByUser, getOrderById, getAllOrders, verifyPayment } = require('../controller/Order.Controlller');
// const router = express.Router();

// // 🔹 Create a new order (Authenticated users only)
// router.post('/create', verifyToken, createOrder);

// // 🔹 Get all orders for the logged-in user
// router.get('/my-orders', verifyToken, getOrdersByUser);

// // 🔹 Get a specific order by ID
// router.get('/:id', verifyToken, getOrderById);

// router.post('/verify', verifyPayment);
// // 🔹 Cancel an order
// // router.put('/:id/cancel', verifyToken, cancelOrder);

// // 🔹 Admin: Get all orders
// router.get('/',getAllOrders);

// module.exports = router;
