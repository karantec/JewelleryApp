const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary'); // Middleware for handling file uploads
const {
  addGoldProduct,
  getAllGoldProducts,
  getGoldProductById,
  updateGoldProduct,
  deleteGoldProduct,
  searchAndFilterGoldProducts
} = require('../controller/GoldProduct.Controller');

// Use upload.fields() to accept both coverImage and images
// For example, one file for coverImage and up to 5 files for images:
const cpUpload = upload.fields([
  { name: 'coverImage', maxCount: 1 },
  { name: 'images', maxCount: 5 }
]);

// ✅ Add a new gold product (with file upload for coverImage and images)
router.post('/add', cpUpload, addGoldProduct);

// ✅ Get all gold products
router.get('/', getAllGoldProducts);

// ✅ Search & Filter gold products
router.get('/search', searchAndFilterGoldProducts);

// ✅ Get a single gold product by ID
router.get('/:id', getGoldProductById);

// ✅ Update a gold product (with file upload for coverImage and images)
router.put('/:id', cpUpload, updateGoldProduct);

// ✅ Delete a gold product
router.delete('/:id', deleteGoldProduct);

module.exports = router;
