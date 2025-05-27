const {
  userSignup,
  userLogin,
  getAllUsers,
  getUserById,
  sendOTP,
  verifyOTP,
  changePassword,
  adminLogin,
  updateUserProfile,
  getUserProfile,
  googleSignIn,
} = require("../controller/User.Controller");
const { verifyToken } = require("../middleware/authmiddleware");

const router = require("express").Router();

// Test API Route
router.get("/", (req, res) => {
  res.send({ message: "Ok, API is working 🚀" });
});

router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);
// Signup Route
router.post("/signup", userSignup);
router.post("/adminLogin", adminLogin);

router.post("/login", userLogin);
router.post("/google-signin", googleSignIn);
// Protected Routes (Require Authentication)

router.get("/users", getAllUsers);
router.get("/:id", verifyToken, getUserById);
//update and get user profile
router.get("/profile", verifyToken, getUserProfile);

router.put("/update", verifyToken, updateUserProfile);

//change password
router.put("/change-password", verifyToken, changePassword);

module.exports = router;
