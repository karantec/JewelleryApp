require("dotenv").config();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const admin = require("../config/firebaseAdmin"); // Firebase Admin SDK
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
    console.log("Received ID Token:", idToken);

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID token is required",
      });
    }

    // Decode the Firebase ID token manually (Emulator safe - no signature verification)
    const decodedToken = jwt.decode(idToken);
    console.log("Decoded Token:", decodedToken);

    if (!decodedToken || !decodedToken.email) {
      return res.status(400).json({
        success: false,
        message: "Invalid token or email not found",
      });
    }

    // Safely extract user info with fallbacks
    const uid = decodedToken.user_id || decodedToken.uid || "";
    const email = decodedToken.email;
    const name = decodedToken.name || email.split("@")[0];
    const picture = decodedToken.picture || "";
    const phone = decodedToken.phone_number || null;
    const isVerified = decodedToken.email_verified ?? false;

    // Check for existing user
    let user = await User.findOne({
      $or: [{ email }, { googleId: uid }],
    });

    let isNewUser = false;

    if (user) {
      // Existing user — selectively update missing fields
      const updateFields = {};

      if (!user.googleId) updateFields.googleId = uid;
      if (!user.profileImage && picture) updateFields.profileImage = picture;
      if (!user.isVerified && isVerified) updateFields.isVerified = true;
      if (!user.name && name) updateFields.name = name;
      if (!user.phone && phone) updateFields.phone = phone;
      if (!user.authProvider) updateFields.authProvider = "google";

      updateFields.lastLoginAt = new Date();

      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updateFields, {
          new: true,
        }).select("-password");
      }
    } else {
      // New user — create and save
      isNewUser = true;

      const newUserData = {
        name,
        email,
        googleId: uid,
        profileImage: picture,
        isVerified,
        addresses: [],
        authProvider: "google",
        lastLoginAt: new Date(),
      };

      // Only include phone if it's not empty/null
      if (phone) {
        newUserData.phone = phone;
      }

      user = new User(newUserData);
      await user.save();
    }

    // Generate your app's own JWT for session
    const token = generateToken(user._id);

    // Return success
    return res.status(200).json({
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
        authProvider: user.authProvider || "google",
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Google Sign-In Error:", error);

    // Firebase Emulator specific or fallback error handling
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

    return res.status(500).json({
      success: false,
      message: "Sign-in failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// User Signup
const userSignup = async (req, res) => {
  try {
    const { name, email, password, phone, profileImage, addresses } = req.body;

    // Validate required fields
    if (!name || !email || !password || !phone) {
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

const otpStore = new Map(); // In-memory store. Use DB/Redis in production.

// Helper function to clean expired OTPs
const cleanExpiredOTPs = () => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) {
      otpStore.delete(phone);
    }
  }
};

const sendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^[6-9]\d{9}$/; // Indian mobile number format
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Clean expired OTPs first
    cleanExpiredOTPs();

    // Check if OTP was recently sent (rate limiting)
    const existingOTP = otpStore.get(phone);
    if (existingOTP && Date.now() < existingOTP.expiresAt) {
      const timeLeft = Math.ceil((existingOTP.expiresAt - Date.now()) / 1000);
      return res.status(429).json({
        message: `OTP already sent. Please wait ${timeLeft} seconds before requesting again.`,
        retryAfter: timeLeft,
      });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);

    // Store OTP with expiration (5 minutes)
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    otpStore.set(phone, {
      otp: otp,
      expiresAt: expiresAt,
      attempts: 0, // Track verification attempts
      createdAt: Date.now(),
    });

    console.log(`Generated OTP for ${phone}: ${otp}`); // For debugging - remove in production

    // Send OTP via Fast2SMS
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp.toString(),
        route: "otp",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
        timeout: 10000, // 10 second timeout
      }
    );

    console.log("Fast2SMS Response:", response.data); // For debugging

    // Check if SMS was sent successfully
    if (response.data && response.data.return === true) {
      res.status(200).json({
        message: "OTP sent successfully",
        phone,
        expiresIn: 300, // 5 minutes in seconds
      });
    } else {
      // Remove OTP from store if SMS failed
      otpStore.delete(phone);
      res.status(500).json({
        message: "Failed to send OTP",
        error: response.data?.message || "SMS service error",
      });
    }
  } catch (error) {
    console.error("Send OTP Error:", error.response?.data || error.message);

    // Remove OTP from store if there was an error
    if (req.body.phone) {
      otpStore.delete(req.body.phone);
    }

    res.status(500).json({
      message: "Failed to send OTP",
      error: error.response?.data?.message || error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ message: "Phone and OTP are required" });
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Clean expired OTPs
    cleanExpiredOTPs();

    const storedData = otpStore.get(phone);

    if (!storedData) {
      return res.status(400).json({
        message: "OTP not found or expired. Please request a new OTP.",
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedData.expiresAt) {
      otpStore.delete(phone);
      return res
        .status(400)
        .json({ message: "OTP expired. Please request a new OTP." });
    }

    // Check attempt limit (max 3 attempts)
    if (storedData.attempts >= 3) {
      otpStore.delete(phone);
      return res.status(400).json({
        message: "Too many failed attempts. Please request a new OTP.",
      });
    }

    // Verify OTP - Convert both to string for comparison to avoid type issues
    const inputOTP = otp.toString().trim();
    const storedOTP = storedData.otp.toString();

    if (inputOTP === storedOTP) {
      // OTP verified successfully - Clean up first
      otpStore.delete(phone);

      // Handle user creation/update with upsert (FIXED APPROACH)
      try {
        const user = await User.findOneAndUpdate(
          { phone }, // filter
          {
            $set: {
              phone,
              isVerified: true,
              otpVerification: {
                verified: true,
                lastVerifiedAt: new Date(),
              },
            },
            // Only set these fields if creating a new document
            $setOnInsert: {
              addresses: [],
              // Add other default fields for new users here
            },
          },
          {
            upsert: true, // Create if doesn't exist
            new: true, // Return the updated document
            runValidators: true, // Run schema validators
          }
        );

        console.log(
          `User ${user.isNew ? "created" : "updated"} for phone: ${phone}`
        );

        // Generate token
        let token;
        try {
          token = generateToken(user._id);
        } catch (tokenError) {
          console.error("Error generating token:", tokenError);
          return res.status(500).json({
            message: "Token generation failed",
            error: "Authentication error",
          });
        }

        return res.status(200).json({
          message: "OTP verified successfully",
          user: {
            _id: user._id,
            phone: user.phone,
            isVerified: user.isVerified,
            otpVerification: user.otpVerification,
            email: user.email,
          },
          token,
          verified: true,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return res.status(500).json({
          message: "Database operation failed",
          error: "Database error",
        });
      }
    } else {
      // Wrong OTP - increment attempts
      storedData.attempts += 1;
      otpStore.set(phone, storedData);

      const attemptsLeft = 3 - storedData.attempts;

      console.log(
        `Invalid OTP attempt for ${phone}. Attempts: ${storedData.attempts}/3`
      );

      return res.status(400).json({
        message: "Invalid OTP",
        attemptsLeft: attemptsLeft > 0 ? attemptsLeft : 0,
        verified: false,
      });
    }
  } catch (error) {
    console.error("Verify OTP Error:", error);

    // Clean up OTP on error to prevent issues
    if (req.body.phone) {
      otpStore.delete(req.body.phone);
    }

    res.status(500).json({
      message: "OTP verification failed",
      error: error.message,
    });
  }
};
const appleSignIn = async (req, res) => {
  try {
    const { idToken } = req.body;
    console.log("Received Apple ID Token:", idToken);

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Apple ID token is required",
      });
    }

    let decodedToken;

    // Verify the Firebase ID token
    try {
      if (
        process.env.NODE_ENV === "development" &&
        process.env.FIREBASE_AUTH_EMULATOR_HOST
      ) {
        // For Firebase Emulator - decode without verification
        decodedToken = jwt.decode(idToken);
        console.log("Emulator - Decoded Token:", decodedToken);

        if (!decodedToken) {
          throw new Error("Invalid token format");
        }
      } else {
        // Production - verify with Firebase Admin
        decodedToken = await admin.auth().verifyIdToken(idToken);
        console.log("Production - Verified Token:", decodedToken);
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      return res.status(401).json({
        success: false,
        message: "Invalid Apple ID token",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }

    // Extract user information from Firebase token
    const uid = decodedToken.uid || decodedToken.user_id;
    const email = decodedToken.email || null;
    const name =
      decodedToken.name ||
      decodedToken.display_name ||
      (email ? email.split("@")[0] : `User_${uid.slice(-8)}`);
    const picture = decodedToken.picture || "";
    const isVerified = decodedToken.email_verified ?? true; // Apple emails are typically verified

    // Apple-specific fields
    const providerId = decodedToken.firebase?.sign_in_provider || "apple.com";
    const appleId =
      decodedToken.firebase?.identities?.["apple.com"]?.[0] || uid;

    console.log("Extracted user data:", {
      uid,
      email,
      name,
      providerId,
      appleId,
      isVerified,
    });

    // Check for existing user
    let user = await User.findOne({
      $or: [{ email: email }, { firebaseUid: uid }, { appleId: appleId }],
    });

    let isNewUser = false;

    if (user) {
      // Existing user — selectively update missing fields
      const updateFields = {};

      if (!user.firebaseUid) updateFields.firebaseUid = uid;
      if (!user.appleId) updateFields.appleId = appleId;
      if (!user.email && email) updateFields.email = email;
      if (!user.profileImage && picture) updateFields.profileImage = picture;
      if (!user.isVerified && isVerified) updateFields.isVerified = isVerified;
      if (!user.name && name) updateFields.name = name;
      if (!user.authProvider || user.authProvider === "email") {
        updateFields.authProvider = "apple";
      }

      updateFields.lastLoginAt = new Date();

      if (Object.keys(updateFields).length > 0) {
        user = await User.findByIdAndUpdate(user._id, updateFields, {
          new: true,
        }).select("-password");
        console.log("Updated existing user:", user.email);
      }
    } else {
      // New user — create and save
      isNewUser = true;

      const newUserData = {
        name,
        email,
        firebaseUid: uid,
        appleId,
        profileImage: picture,
        isVerified,
        addresses: [],
        authProvider: "apple",
        lastLoginAt: new Date(),
      };

      console.log("Creating new user with data:", newUserData);

      user = new User(newUserData);
      await user.save();
      console.log("Created new user:", user.email || user.name);
    }

    // Generate your app's own JWT for session
    const token = generateToken(user._id);

    // Return success response
    return res.status(200).json({
      success: true,
      message: isNewUser
        ? "Account created and signed in successfully"
        : "Signed in successfully",
      isNewUser,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
        addresses: user.addresses || [],
        isVerified: user.isVerified,
        authProvider: user.authProvider || "apple",
        firebaseUid: user.firebaseUid,
        appleId: user.appleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  } catch (error) {
    console.error("Apple Sign-In Error:", error);

    // Handle specific Firebase errors
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

    return res.status(500).json({
      success: false,
      message: "Sign-in failed. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

const startOTPCleanup = () => {
  setInterval(cleanExpiredOTPs, 60000); // Clean every minute
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

const resendOTP = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Validate phone number format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Invalid phone number format" });
    }

    // Clean expired OTPs first
    cleanExpiredOTPs();

    const existingOTP = otpStore.get(phone);

    // Check if there's a recent OTP request (rate limiting - minimum 30 seconds between requests)
    if (existingOTP) {
      const timeSinceLastRequest = Date.now() - existingOTP.createdAt;
      const minWaitTime = 30 * 1000; // 30 seconds

      if (timeSinceLastRequest < minWaitTime) {
        const waitTime = Math.ceil((minWaitTime - timeSinceLastRequest) / 1000);
        return res.status(429).json({
          message: `Please wait ${waitTime} seconds before requesting OTP again`,
          retryAfter: waitTime,
          canResend: false,
        });
      }

      // Check resend limit (max 3 resends per phone number per hour)
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      if (
        existingOTP.resendCount >= 3 &&
        existingOTP.firstRequestAt > oneHourAgo
      ) {
        const resetTime = Math.ceil(
          (existingOTP.firstRequestAt + 60 * 60 * 1000 - Date.now()) / 60000
        );
        return res.status(429).json({
          message: `Maximum resend limit reached. Try again after ${resetTime} minutes`,
          retryAfter: resetTime * 60,
          canResend: false,
        });
      }
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000; // 5 minutes

    // Update or create OTP data
    const otpData = existingOTP
      ? {
          otp: otp,
          expiresAt: expiresAt,
          attempts: 0,
          createdAt: now,
          resendCount: (existingOTP.resendCount || 0) + 1,
          firstRequestAt: existingOTP.firstRequestAt || now,
          lastResendAt: now,
        }
      : {
          otp: otp,
          expiresAt: expiresAt,
          attempts: 0,
          createdAt: now,
          resendCount: 1,
          firstRequestAt: now,
          lastResendAt: now,
        };

    otpStore.set(phone, otpData);

    console.log(
      `Resent OTP for ${phone}: ${otp} (Resend #${otpData.resendCount})`
    ); // For debugging - remove in production

    // Send OTP via Fast2SMS
    const response = await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      {
        variables_values: otp.toString(),
        route: "otp",
        numbers: phone,
      },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
        timeout: 10000,
      }
    );

    console.log("Fast2SMS Resend Response:", response.data);

    if (response.data && response.data.return === true) {
      const remainingResends = Math.max(0, 3 - otpData.resendCount);

      res.status(200).json({
        message: "OTP resent successfully",
        phone,
        expiresIn: 300, // 5 minutes
        resendCount: otpData.resendCount,
        remainingResends: remainingResends,
        canResend: remainingResends > 0,
        nextResendIn: 30, // seconds
      });
    } else {
      // Revert resend count if SMS failed
      if (existingOTP) {
        existingOTP.resendCount = Math.max(
          0,
          (existingOTP.resendCount || 1) - 1
        );
        otpStore.set(phone, existingOTP);
      } else {
        otpStore.delete(phone);
      }

      res.status(500).json({
        message: "Failed to resend OTP",
        error: response.data?.message || "SMS service error",
      });
    }
  } catch (error) {
    console.error("Resend OTP Error:", error.response?.data || error.message);

    // Revert changes on error
    const existingOTP = otpStore.get(req.body.phone);
    if (existingOTP && existingOTP.resendCount > 0) {
      existingOTP.resendCount -= 1;
      otpStore.set(req.body.phone, existingOTP);
    }

    res.status(500).json({
      message: "Failed to resend OTP",
      error: error.response?.data?.message || error.message,
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
  startOTPCleanup,
  resendOTP,
  appleSignIn,
};
