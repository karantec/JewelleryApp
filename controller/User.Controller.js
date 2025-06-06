require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const axios = require("axios");
const User = require("../models/User.model");
const Admin = require("../models/Admin.model");
// Use the JWT secret from .env (fallback to a default for development)
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Generate JWT Token
const generateToken = (_id) => {
  return jwt.sign({ _id }, JWT_SECRET, { expiresIn: "2h" });
};
const generateAdminToken = (adminId) => {
  return jwt.sign({ id: adminId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

const googleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, phone_number, email_verified } =
      decodedToken;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required for Google sign-in",
      });
    }

    // Check if user already exists by email or Google ID
    let user = await User.findOne({
      $or: [{ email: email }, { googleId: uid }],
    });

    let isNewUser = false;

    if (user) {
      // Existing user - update Google info and login
      const updateFields = {};

      if (!user.googleId) updateFields.googleId = uid;
      if (!user.profileImage && picture) updateFields.profileImage = picture;
      if (!user.isVerified && email_verified) updateFields.isVerified = true;
      if (!user.name && name) updateFields.name = name;
      if (!user.phone && phone_number) updateFields.phone = phone_number;
      if (!user.authProvider) updateFields.authProvider = "google";

      // Update last login
      updateFields.lastLoginAt = new Date();

      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updateFields, {
          new: true,
        }).select("-password");
      }
    } else {
      // New user - create account automatically
      isNewUser = true;

      user = new User({
        name: name || email.split("@")[0],
        email: email,
        googleId: uid,
        profileImage: picture || "",
        phone: phone_number || "",
        isVerified: email_verified || true,
        addresses: [],
        authProvider: "google",
        lastLoginAt: new Date(),
        // No password field for Google users
      });

      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return success response
    res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and signed in successfully"
        : "Signed in successfully",
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        profileImage: user.profileImage || "",
        addresses: user.addresses || [],
        isVerified: user.isVerified,
        authProvider: "google",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Google Sign-In Error:", error);

    // Handle specific Firebase auth errors
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please sign in again.",
      });
    }

    if (error.code === "auth/invalid-id-token") {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication. Please try again.",
      });
    }

    if (error.code === "auth/project-not-found") {
      return res.status(500).json({
        success: false,
        message: "Authentication service not configured properly.",
      });
    }

    // Generic error response
    res.status(500).json({
      success: false,
      message: "Sign-in failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const linkGoogleAccount = async (req, res) => {
  try {
    const userId = req.user._id; // From auth middleware
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required",
      });
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, picture } = decodedToken;

    // Check if Google account is already linked to another user
    const existingGoogleUser = await User.findOne({ googleId: uid });
    if (
      existingGoogleUser &&
      existingGoogleUser._id.toString() !== userId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "This Google account is already linked to another user",
      });
    }

    // Update current user with Google info
    const user = await User.findByIdAndUpdate(
      userId,
      {
        googleId: uid,
        profileImage: picture || user.profileImage,
      },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Google account linked successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        isVerified: user.isVerified,
        googleId: user.googleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Link Google Account Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link Google account",
      error: error.message,
    });
  }
};
const unlinkGoogleAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (!user.googleId) {
      return res.status(400).json({
        success: false,
        message: "No Google account linked to this user",
      });
    }

    // Check if user has password set (to ensure they can still login)
    if (!user.password && user.authProvider === "google") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot unlink Google account. Please set a password first to maintain account access.",
      });
    }

    // Remove Google ID
    user.googleId = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Google account unlinked successfully",
    });
  } catch (error) {
    console.error("Unlink Google Account Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unlink Google account",
      error: error.message,
    });
  }
};

// User Signup
const userSignup = async (req, res) => {
  try {
    const { name, email, password, phone, profileImage, addresses } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone || !profileImage) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists by email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user instance
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phone,
      profileImage,
      addresses: addresses || [],
    });

    // Save the user to the database
    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Respond with user data
    res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        profileImage: newUser.profileImage,
        addresses: newUser.addresses,
        createdAt: newUser.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// const sendOTP = async (req, res) => {
//   try {
//     const { phone } = req.body;

//     if (!phone) {
//       return res.status(400).json({ message: "Phone number is required" });
//     }

//     const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;

//     const { TWILIO_VERIFY_SERVICE_SID } = process.env;

//     if (!TWILIO_VERIFY_SERVICE_SID) {
//       return res
//         .status(500)
//         .json({ message: "Twilio Verify Service SID is not configured" });
//     }

//     const verification = await twilioClient.verify.v2
//       .services(TWILIO_VERIFY_SERVICE_SID)
//       .verifications.create({
//         to: phoneNumber,
//         channel: "sms",
//       });

//     res.status(200).json({
//       message: "OTP sent successfully",
//       verificationSid: verification.sid,
//       status: verification.status,
//     });
//   } catch (error) {
//     console.error("OTP Send Error:", error);
//     res
//       .status(500)
//       .json({ message: "Failed to send OTP", error: error.message });
//   }
// };

const otpStore = new Map(); // In-memory store. Use DB/Redis in production.

const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: "Phone is required" });

    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore.set(phone, otp); // Store temporarily

    const message = `Your OTP is ${otp}`;

    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp,
        route: "otp",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
      }
    );

    if (response.data.return) {
      res.status(200).json({ message: "OTP sent successfully", phone });
    } else {
      res.status(500).json({ message: "Failed to send OTP" });
    }
  } catch (error) {
    console.error("Send OTP Error:", error.response?.data || error.message);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

// const verifyOTP = async (req, res) => {
//   try {
//     const { phone, otp } = req.body;

//     if (!phone || !otp) {
//       return res.status(400).json({ message: "Phone and OTP are required" });
//     }

//     const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;
//     const { TWILIO_VERIFY_SERVICE_SID } = process.env;

//     if (!TWILIO_VERIFY_SERVICE_SID) {
//       return res.status(500).json({
//         message: "Twilio Verify Service SID not found in environment",
//       });
//     }

//     const verificationCheck = await twilioClient.verify.v2
//       .services(TWILIO_VERIFY_SERVICE_SID)
//       .verificationChecks.create({
//         to: phoneNumber,
//         code: otp,
//       });

//     if (verificationCheck.status !== "approved") {
//       return res.status(400).json({ message: "Invalid OTP" });
//     }

//     let user = await User.findOne({ phone: phoneNumber });
//     if (!user) {
//       const placeholderEmail = `user_${phoneNumber.replace(
//         "+",
//         ""
//       )}@example.com`;
//       user = new User({
//         phone: phoneNumber,
//         isVerified: true,
//         email: placeholderEmail,
//         otpVerification: { verified: true, lastVerifiedAt: new Date() },
//       });
//       await user.save();
//     } else {
//       user.isVerified = true;
//       user.otpVerification = { verified: true, lastVerifiedAt: new Date() };
//       await user.save();
//     }

//     const token = generateToken(user._id);

//     res.status(200).json({
//       message: "OTP verified successfully",
//       user: {
//         _id: user._id,
//         phone: user.phone,
//         isVerified: user.isVerified,
//         otpVerification: user.otpVerification,
//       },
//       token,
//     });
//   } catch (error) {
//     console.error("OTP Verification Error:", error);
//     res
//       .status(500)
//       .json({ message: "OTP verification failed", error: error.message });
//   }
// };

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp)
      return res.status(400).json({ message: "Phone and OTP required" });

    const storedOtp = otpStore.get(phone);
    if (parseInt(otp) !== storedOtp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    otpStore.delete(phone); // Remove after successful verification

    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        phone,
        isVerified: true,
        email: `user_${phone}@example.com`,
        otpVerification: { verified: true, lastVerifiedAt: new Date() },
        addresses: [
          {
            primaryPhone: phone,
            zipcode: "000000",
            state: "Unknown",
            city: "Unknown",
            addressLine: "Temporary Address",
          },
        ],
      });
      await user.save();
    } else {
      user.isVerified = true;
      user.otpVerification = { verified: true, lastVerifiedAt: new Date() };
      await user.save();
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "OTP verified successfully",
      user: {
        _id: user._id,
        phone: user.phone,
        isVerified: user.isVerified,
        otpVerification: user.otpVerification,
      },
      token,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res
      .status(500)
      .json({ message: "OTP verification failed", error: error.message });
  }
};

const adminSignup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      email,
      password: hashedPassword,
    });

    await newAdmin.save();

    const token = generateAdminToken(newAdmin._id);

    res.status(201).json({
      message: "Admin registered successfully",
      admin: {
        _id: newAdmin._id,

        email: newAdmin.email,
        createdAt: newAdmin.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Admin Signup Error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateAdminToken(admin._id);

    res.status(200).json({
      message: "Admin login successful",
      admin: {
        _id: admin._id,

        email: admin.email,
        createdAt: admin.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error("Admin Login Error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// User Login with JWT
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = generateToken(user._id);

    // Respond with user data
    res.status(200).json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

// Get a user by ID (Protected)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Get all users (Protected)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    if (!users || users.length === 0) {
      return res.status(404).json({ message: "No users found" });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch users", error: error.message });
  }
};
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if userId exists
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { name, email, phone, profileImage, addresses } = req.body;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update fields only if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (profileImage) user.profileImage = profileImage;
    if (addresses) user.addresses = addresses;

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      error: error.message,
    });
  }
};
const changePassword = async (req, res) => {
  try {
    const { userId } = req.user; // Assuming user ID is extracted from authenticated token
    const { oldPassword, newPassword } = req.body;

    // Validate input
    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required" });
    }

    // Find user in database
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare old password with stored hash
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change Password Error:", error);
    res
      .status(500)
      .json({ message: "Failed to change password", error: error.message });
  }
};

module.exports = {
  userSignup,
  userLogin,
  getAllUsers,
  getUserById,
  sendOTP,
  verifyOTP,
  changePassword,
  adminSignup,
  adminLogin,
  googleSignIn,
  getUserProfile,
  updateUserProfile,
};
