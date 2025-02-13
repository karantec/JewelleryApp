const Razorpay = require('razorpay');
require('dotenv').config(); // Load API keys from .env file

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = razorpay;
