const { cloudinary } = require("../config/cloudinary");
const Blog = require("../models/Blog.model");

// **Create a New Blog Post with Image Upload**
const createBlog = async (req, res) => {
  try {
    const { title, content, tags, isPublished, image } = req.body;

    // Create a new blog post with the provided data
    const newBlog = new Blog({
      title,
      content,
      tags,
      isPublished,
      image,
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog post created successfully", blog: newBlog });
  } catch (error) {
    console.error("Error in createBlog:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find();

    if (!blogs.length) {
      return res.status(404).json({ message: "No blog posts found" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get Single Blog Post by ID**
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Update Blog Post with Image Upload**
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, tags, isPublished, image } = req.body;
    let imageUrl = '';

    if (image) {
      const result = await cloudinary.uploader.upload(image, { folder: "blogs" });
      imageUrl = result.secure_url; 
    }

    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, content, tags, isPublished, image: imageUrl, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({ message: "Blog post updated successfully", updatedBlog });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Delete a Blog Post**
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog };
