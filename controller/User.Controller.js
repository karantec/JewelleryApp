require('dotenv').config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User.model");

// Use the JWT secret from .env (fallback to a default for development)
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "2h" });
};

const twilio = require("twilio");

// Load Twilio credentials from environment variables
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

// Initialize Twilio client
const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

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

const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;

    if (!TWILIO_VERIFY_SERVICE_SID) {
      return res
        .status(500)
        .json({ message: "Twilio Verify Service SID is not configured" });
    }

    const verification = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verifications.create({
        to: phoneNumber,
        channel: "sms",
      });

    res.status(200).json({
      message: "OTP sent successfully",
      verificationSid: verification.sid,
      status: verification.status,
    });
  } catch (error) {
    console.error("OTP Send Error:", error);
    res
      .status(500)
      .json({ message: "Failed to send OTP", error: error.message });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // Ensure phone number is in E.164 format
    const phoneNumber = phone.startsWith("+") ? phone : `+91${phone}`;

    // Verify OTP using Twilio
    const verificationCheck = await twilioClient.verify.v2
      .services(TWILIO_VERIFY_SERVICE_SID)
      .verificationChecks.create({
        to: phoneNumber,
        code: otp,
      });

    if (verificationCheck.status !== "approved") {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Find user in database by phone
    let user = await User.findOne({ phone: phoneNumber });
    if (!user) {
      const placeholderEmail = `user_${phoneNumber.replace("+", "")}@example.com`;
      user = new User({
        phone: phoneNumber,
        isVerified: true,
        email: placeholderEmail,
        otpVerification: { verified: true, lastVerifiedAt: new Date() },
      });
      await user.save();
    } else {
      user.isVerified = true;
      user.otpVerification = { verified: true, lastVerifiedAt: new Date() };
      await user.save();
    }

    // Generate a fresh JWT after successful OTP verification
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
    console.error("OTP Verification Error:", error);
    res
      .status(500)
      .json({ message: "OTP verification failed", error: error.message });
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

module.exports = {
  userSignup,
  userLogin,
  getAllUsers,
  getUserById,
  sendOTP,
  verifyOTP,
};
