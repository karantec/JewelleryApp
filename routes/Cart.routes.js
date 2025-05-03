const express = require("express");
const {
  addToCart,
  getCart,
  removeFromCart,
  removeSingleItemFromCart,
} = require("../controller/Cart.controller");

const router = express.Router();

// Add to Cart
router.post("/add-to-cart", addToCart);

// Get Cart Items
router.get("/cart/:userId", getCart);

router.patch("/cart/remove-single-item", removeSingleItemFromCart);

// Remove from Cart
router.delete("/remove-from-cart", removeFromCart);

module.exports = router;
