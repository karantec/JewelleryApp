const { cloudinary } = require("../config/cloudinary");
const Instagram = require("../models/Instagram.model");

// Create a new Instagram Post (Image Upload)
const createInstagramPost = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ message: "Image is required" });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "instagram-posts",
    });

    const newPost = new Instagram({
      image: result.secure_url,
    });

    await newPost.save();
    res.status(201).json({
      message: "Instagram post created successfully",
      post: newPost,
    });
  } catch (error) {
    console.error("Error in createInstagramPost:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Instagram Posts
const getAllInstagramPosts = async (req, res) => {
  try {
    const posts = await Instagram.find().sort({ createdAt: -1 });

    if (!posts.length) {
      return res.status(404).json({ message: "No Instagram posts found" });
    }

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Instagram Post by ID
const getInstagramPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Instagram.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Instagram post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Instagram Post
const updateInstagramPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;
    let imageUrl = "";

    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "instagram-posts",
      });
      imageUrl = result.secure_url;
    }

    const updatedPost = await Instagram.findByIdAndUpdate(
      id,
      { image: imageUrl || image },
      { new: true }
    );

    if (!updatedPost) {
      return res.status(404).json({ message: "Instagram post not found" });
    }

    res.status(200).json({
      message: "Instagram post updated successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Instagram Post
const deleteInstagramPost = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedPost = await Instagram.findByIdAndDelete(id);

    if (!deletedPost) {
      return res.status(404).json({ message: "Instagram post not found" });
    }

    res.status(200).json({ message: "Instagram post deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createInstagramPost,
  getAllInstagramPosts,
  getInstagramPostById,
  updateInstagramPost,
  deleteInstagramPost,
};
