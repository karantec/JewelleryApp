const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary'); // Middleware for handling file uploads
const { addGoldProduct, getAllGoldProducts, getGoldProductById, updateGoldProduct, deleteGoldProduct, searchAndFilterGoldProducts } = require('../controller/GoldProduct.Controller');

// ✅ Add a new gold product (with image upload)
router.post('/add', upload.array('images', 5),addGoldProduct);

// ✅ Get all gold products
router.get('/', getAllGoldProducts);

router.get('/search', searchAndFilterGoldProducts);

// ✅ Get a single gold product by ID
router.get('/:id', getGoldProductById);

// ✅ Update a gold product (with image upload)
router.put('/:id', upload.array('images', 5),updateGoldProduct);

// ✅ Delete a gold product
router.delete('/:id', deleteGoldProduct);

// ✅ Search & Filter gold products

module.exports = router;
