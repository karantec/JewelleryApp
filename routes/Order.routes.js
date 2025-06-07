// routes/Order.routes.js
const express = require("express");

const { verifyToken, isAdmin } = require("../middleware/authmiddleware");
const {
  createOrder,
  verifyOrder,
  getUserOrders,
  getOrderById,
  getAllOrders,
} = require("../controller/Order.Controlller");

const router = express.Router();

// 🔹 Create a new order (Authenticated users only)
router.post("/create", verifyToken, createOrder);
router.post("/verify", verifyToken, verifyOrder);

// Get user's orders
router.get("/user", verifyToken, getUserOrders);

// Get specific order by ID
router.get("/user/:orderId", verifyToken, getOrderById);
// // 🔹 Get all orders for the logged-in user
// router.get("/my-orders", verifyToken, getOrdersByUser);

// // 🔹 Get a specific order by ID
// router.get("/:id", verifyToken, getOrderById);

// router.post("/verify", verifyPayment);
// 🔹 Cancel an order
// router.put('/:id/cancel', verifyToken, cancelOrder);

// // 🔹 Admin: Get all orders
router.get("/", getAllOrders);

module.exports = router;
