const express = require('express');


const { createCategory, getAllCatgory, getCategoryById, updateCategory, deleteCategory } = require('../controller/Category.Controller');

const router = express.Router();

// **Routes**
router.post('/createCategory', createCategory);
router.get('/getAllCategory', getAllCatgory)
// router.get('/category/:id', getCategoryById);
router.put('/updateCategory/:id', updateCategory);
router.delete('/deleteCategory/:id', deleteCategory);

module.exports = router;
