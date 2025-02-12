const Blog = require("../models/Blog.model");

// **Create a New Blog Post**
const createBlog = async (req, res) => {
  try {
    const { title, content, tags, isPublished } = req.body;

    // Create a new blog post
    const newBlog = new Blog({
      title,
      content,
      tags,
      isPublished,
    });

    await newBlog.save();
    res.status(201).json({ message: "Blog post created successfully", newBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Get All Blog Posts**
const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find(); // Fetch all blog posts

    if (!blogs || blogs.length === 0) {
      return res.status(404).json({ message: "No blog posts found" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Get Single Blog Post by ID**
const getBlogById = async (req, res) => {
  try {
    const { id } = req.params; // Get the blog post ID from the URL parameter
    const blog = await Blog.findById(id); // Fetch the blog post by ID

    if (!blog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Update a Blog Post**
const updateBlog = async (req, res) => {
  try {
    const { id } = req.params; // Get the blog post ID from the URL parameter
    const { title, content, tags, isPublished } = req.body;

    // Find the blog post by ID and update it
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      { title, content, tags, isPublished, updatedAt: Date.now() },
      { new: true } // Returns the updated document
    );

    if (!updatedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({ message: "Blog post updated successfully", updatedBlog });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Delete a Blog Post**
const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params; // Get the blog post ID from the URL parameter

    // Find and delete the blog post by ID
    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json({ message: "Blog post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog };
