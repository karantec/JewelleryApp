const express = require('express');
const { addTodayPrice, updateTodayPrice, getAllPrice } = require('../controller/Price.Controller');

const router = express.Router();

// **Routes**
router.post('/todayPrice', addTodayPrice);
router.get('/PriceRouting', getAllPrice);
router.patch('/price/:id', updateTodayPrice);



module.exports = router;
