const express = require('express');
const { addToCart, getCart, removeFromCart } = require('../controller/Cart.controller');

const router = express.Router();

// Add to Cart
router.post('/add-to-cart', addToCart);

// Get Cart Items
router.get('/cart/:userId', getCart);

// Remove from Cart
router.delete('/remove-from-cart',removeFromCart);

module.exports = router;
