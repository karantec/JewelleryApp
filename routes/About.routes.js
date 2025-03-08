const express = require('express');
const {createAbout,getAllAbout}=require('../controller/About.Controller')
const router = express.Router();

// **Routes**
router.post('/create',createAbout);
router.get('/about', getAllAbout);


module.exports = router;
