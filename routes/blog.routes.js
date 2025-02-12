const express = require('express');
const { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog } = require('../controller/Blog.Controller');
const router = express.Router();

// Import the 
  
// **Create a New Blog Post**
router.post('/blogs', createBlog);

// **Get All Blog Posts**
router.get('/blogs', getAllBlogs);

// **Get Single Blog Post by ID**
router.get('/blogs/:id', getBlogById);

// **Update a Blog Post**
router.put('/blogs/:id', updateBlog);

// **Delete a Blog Post**
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
