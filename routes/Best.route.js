const express = require("express");
const {
  createBest,
  getAllBest,
  getBestById,
  updateBest,
  deleteBest,
} = require("../controller/Best.Controller");
const router = express.Router();

// Create a Best Selling item
router.post("/", createBest);

// Get all Best Selling items
router.get("/", getAllBest);

// Get a single Best Selling item by ID
router.get("/:id", getBestById);

// Update a Best Selling item
router.put("/:id", updateBest);

// Delete a Best Selling item
router.delete("/:id", deleteBest);

module.exports = router;
