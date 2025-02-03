const express = require('express');

const { createOrder, getAllOrders, getOrderById, updateOrder, deleteOrder } = require('../controller/Order.Controlller');
const router = express.Router();

// Route to create a new order
router.post('/createOrder',createOrder );

// Route to get all orders
router.get('/getOrder', getAllOrders);

// Route to get a specific order by ID
router.get('/:id', getOrderById);

// Route to update an order
router.put('/:id', updateOrder);

// Route to delete an order
router.delete('/:id', deleteOrder);

module.exports = router;
