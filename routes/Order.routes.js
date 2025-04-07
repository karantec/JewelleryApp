// routes/Order.routes.js
const express = require('express');
const {
    createOrder,
  
} = require('../controller/Order.Controlller'); // Fixed typo in filename
const { verifyToken } = require('../middleware/authmiddleware');
const router = express.Router();

// Create a new order (Protected: Only authenticated users)
router.post('/create', verifyToken, createOrder);

module.exports = router;