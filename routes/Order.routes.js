const express = require('express');// Importing the verifyToken middleware
const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder, getOrdersByUser } = require('../controller/Order.Controlller');
const { verifyToken } = require('../middleware/authmiddleware');
const router = express.Router();

// Route to create a new order (protected, only accessible by authenticated users)
router.post('/createOrder', verifyToken, createOrder);

// Route to get all orders (this can be public or protected depending on your needs, but we'll leave it open here)
router.get('/getOrder', getAllOrders);

// Route to get a specific order by ID (this can be public or protected depending on your needs)
router.get('/:id', getOrderById);

// Route to get orders by a specific user ID (protected, only accessible by authenticated users)
router.get('/getOrderByUser/:userId', verifyToken, getOrdersByUser);

// Route to update an order (protected, only accessible by authenticated users)
router.put('/:id', verifyToken, updateOrder);

// Route to delete an order (protected, only accessible by authenticated users)
router.delete('/:id', verifyToken, deleteOrder);

module.exports = router;
