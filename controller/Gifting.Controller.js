const { cloudinary } = require("../config/cloudinary");
const Gifting = require("../models/Gifting.model");

// Create a new Gifting Post (with Image Upload)
const createGiftingPost = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "gifting-posts",
    });

    const newPost = new Gifting({
      image: result.secure_url,
    });

    await newPost.save();

    res.status(201).json({
      message: "Gifting post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error in createGiftingPost:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Gifting Posts
const getAllGiftingPosts = async (req, res) => {
  try {
    const posts = await Gifting.find().sort({ createdAt: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No gifting posts found" });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getAllGiftingPosts:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Gifting Post by ID
const getGiftingPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Gifting.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Gifting post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in getGiftingPostById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Gifting Post
const updateGiftingPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;

    let updatedData = {};

    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "gifting-posts",
      });
      updatedData.image = result.secure_url;
    }

    const updatedPost = await Gifting.findByIdAndUpdate(id, updatedData, {
      new: true,
    });

    if (!updatedPost) {
      return res.status(404).json({ message: "Gifting post not found" });
    }

    res.status(200).json({
      message: "Gifting post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error in updateGiftingPost:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Gifting Post
const deleteGiftingPost = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedPost = await Gifting.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Gifting post not found" });
    }

    res.status(200).json({ message: "Gifting post deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGiftingPost:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createGiftingPost,
  getAllGiftingPosts,
  getGiftingPostById,
  updateGiftingPost,
  deleteGiftingPost,
};
