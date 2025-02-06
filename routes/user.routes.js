const { userSignup, userLogin, getAllUsers,getUserById } = require('../controller/User.Controller');

const router = require('express').Router();

// Test API Route
router.get('/', (req, res) => {
  res.send({ message: 'Ok, API is working 🚀' });
});

// Signup Route
router.post('/signup', userSignup);


//get user route 
router.get("/:id", getUserById);
//get user route 
router.get("/users", getAllUsers);

// Login Route
router.post('/login', userLogin);


module.exports = router;
