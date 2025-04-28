const express = require("express");
const {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
} = require("../controller/Shop.Controller");
const router = express.Router();

// Import the controller functions

// Create a new shop entry
router.post("/", createShop);

// Get all shop entries
router.get("/", getAllShops);

// Get a single shop entry by ID
router.get("/:id", getShopById);

// Update a shop entry by ID
router.put("/:id", updateShop);

// Delete a shop entry by ID
router.delete("/:id", deleteShop);

module.exports = router;
