const express = require('express');
const { createBlog, getAllBlogs, getBlogById, updateBlog, deleteBlog } = require('../controller/Blog.Controller');
const { upload } = require('../config/cloudinary'); 

const router = express.Router();
const cpUpload = upload.fields([
    { name: 'images', maxCount: 5 }
  ]);
// **Routes**
router.post('/blogs', cpUpload,createBlog);
router.get('/blogs', getAllBlogs);
router.get('/blogs/:id', getBlogById);
router.put('/blogs/:id',cpUpload, updateBlog);
router.delete('/blogs/:id', deleteBlog);

module.exports = router;
