const express = require('express');

const { upload } = require('../config/cloudinary'); 
const { createCategory, getAllCatgory, getCategoryById, updateCategory, deleteCategory } = require('../controller/Category.Controller');

const router = express.Router();
const cpUpload = upload.fields([
    { name: 'images', maxCount: 5 }
  ]);
// **Routes**
router.post('/createCategory', cpUpload,createCategory);
router.get('/getAllCategory', getAllCatgory)
// router.get('/category/:id', getCategoryById);
// router.put('/updateCategory/:id',cpUpload, updateCategory);
// router.delete('/deleteCategory/:id', deleteCategory);

module.exports = router;
