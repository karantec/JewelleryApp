const express = require("express");
const {
  createTestimonial,
  getAllTestimonials,
  getTestimonialById,
  updateTestimonial,
  deleteTestimonial,
} = require("../controller/Testimonial.Controller");
const router = express.Router();

// Create a new testimonial
router.post("/", createTestimonial);

// Get all testimonials
router.get("/", getAllTestimonials);

// Get a testimonial by ID
router.get("/:id", getTestimonialById);

// Update a testimonial by ID
router.put("/:id", updateTestimonial);

// Delete a testimonial by ID
router.delete("/:id", deleteTestimonial);

module.exports = router;
