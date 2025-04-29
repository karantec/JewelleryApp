const express = require("express");
const {
  createFeature,
  getAllFeatures,
  getFeatureById,
  updateFeature,
  deleteFeature,
} = require("../controller/Feature.Controller");
const router = express.Router();

// CREATE a new feature
router.post("/", createFeature);

// GET all features
router.get("/", getAllFeatures);

// GET a feature by ID
router.get("/:id", getFeatureById);

// UPDATE a feature by ID
router.put("/:id", updateFeature);

// DELETE a feature by ID
router.delete("/:id", deleteFeature);

module.exports = router;
