
const { userSignup, userLogin, getAllUsers, getUserById, sendOTP, verifyOTP } = require('../controller/User.Controller');
const { verifyToken } = require('../middleware/authmiddleware');

const router = require('express').Router();

// Test API Route
router.get('/', (req, res) => {
  res.send({ message: 'Ok, API is working 🚀' });
});


router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
// Signup Route
router.post('/signup', userSignup);

// Login Route
router.post('/login', userLogin);

// Protected Routes (Require Authentication)
router.get('/users', verifyToken, getAllUsers);
router.get('/:id', verifyToken, getUserById);

module.exports = router;
