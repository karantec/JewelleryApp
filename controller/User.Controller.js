const mongoose = require("mongoose");
const User = require('../models/User.model');
// User Signup
const bcrypt = require('bcryptjs');
 // Adjust the path as per your project structure

const userSignup = async (req, res) => {
    try {
        const { name, email, password, phone, profileImage, addresses } = req.body;

        // Validate required fields
        if (!name || !email || !password || !phone || !profileImage) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if the user already exists by email
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already in use' });
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
            addresses: addresses || [] // Default to empty array if no addresses are provided
        });

        // Save the user to the database
        await newUser.save();

        // Respond with success message
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error(error); // Log the error for debugging purposes
        res.status(500).json({ message: 'Signup failed', error: error.message });
    }
};

const getUserById = async (req, res) => {
    const { id } = req.params;
  
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
  
    try {
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
  
  // Get all users
  const getAllUsers = async (req, res) => {
    try {
      console.log("Fetching all users...");
  
      const users = await User.find().select("-password");
  
      console.log("Users found:", users); // Log the data
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "No users found" });
      }
  
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users", error: error.message });
    }
  };
  
// User Login
const userLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        res.status(200).json({ message: 'Login successful', userId: user._id });
    } catch (error) {
        res.status(500).json({ message: 'Login failed' });
    }
};

module.exports = { userSignup, userLogin,getAllUsers, getUserById };
