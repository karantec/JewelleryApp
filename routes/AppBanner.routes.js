const express = require("express");
const {
  getAppBanners,
  getAppBannerById,
  updateAppBanner,
  deleteAppBanner,
  createAppBanner,
} = require("../controller/AppBanne.controller");
const router = express.Router();

// Create a new banner
router.post("/", createAppBanner);

// Get all banners
router.get("/", getAppBanners);

// Get a single banner by ID
router.get("/:id", getAppBannerById);

// Update a banner by ID
router.put("/:id", updateAppBanner);

// Delete a banner by ID
router.delete("/:id", deleteAppBanner);

module.exports = router;
