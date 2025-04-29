const express = require("express");
const {
  createInstagramPost,
  getAllInstagramPosts,
  getInstagramPostById,
  updateInstagramPost,
  deleteInstagramPost,
} = require("../controller/Instagram.Controller");
const router = express.Router();

// Create a new Instagram post
router.post("/", createInstagramPost);

// Get all Instagram posts
router.get("/", getAllInstagramPosts);

// Get a single Instagram post by ID
router.get("/:id", getInstagramPostById);

// Update an Instagram post by ID
router.put("/:id", updateInstagramPost);

// Delete an Instagram post by ID
router.delete("/:id", deleteInstagramPost);

module.exports = router;
