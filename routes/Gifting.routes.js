const express = require("express");
const {
  createGiftingPost,
  getAllGiftingPosts,
  getGiftingPostById,
  updateGiftingPost,
  deleteGiftingPost,
} = require("../controller/Gifting.Controller");
const router = express.Router();

// @route   POST /gifting
// @desc    Create a new gifting post
router.post("/", createGiftingPost);

// @route   GET /gifting
// @desc    Get all gifting posts
router.get("/", getAllGiftingPosts);

// @route   GET /gifting/:id
// @desc    Get gifting post by ID
router.get("/:id", getGiftingPostById);

// @route   PUT /gifting/:id
// @desc    Update gifting post by ID
router.put("/:id", updateGiftingPost);

// @route   DELETE /gifting/:id
// @desc    Delete gifting post by ID
router.delete("/:id", deleteGiftingPost);

module.exports = router;
