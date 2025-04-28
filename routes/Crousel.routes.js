const express = require("express");
const {
  createCrousel,
  getAllCrousels,
  getCrouselById,
  updateCrousel,
  deleteCrousel,
} = require("../controller/Crousel.Controller");
const router = express.Router();

// Create a new carousel item
router.post("/create", createCrousel);

// Get all carousel items
router.get("/", getAllCrousels);

// Get a single carousel item by ID
router.get("/:id", getCrouselById);

// Update a carousel item
router.put("/:id", updateCrousel);

// Delete a carousel item
router.delete("/:id", deleteCrousel);

module.exports = router;
