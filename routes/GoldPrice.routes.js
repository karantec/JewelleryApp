const express = require('express');
const { addTodayPrice, updateTodayPrice, getTodayPrice } = require('../controller/GoldPrice.Controller');



const router = express.Router();

// **Routes**
router.post('/createPrice', addTodayPrice);
router.get('/todayPrice', getTodayPrice);
router.put('/gold-price/:id', updateTodayPrice);
// router.get('/category/:id', getCategoryById);


module.exports = router;
