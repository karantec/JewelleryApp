const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');

// Use the JWT secret from .env (fallback to a default for development)
const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

// User Signup
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
      addresses: addresses || [], // Default to empty array if no addresses are provided
    });

    // Save the user to the database
    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Respond with user data
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        profileImage: newUser.profileImage,
        addresses: newUser.addresses,
        createdAt: newUser.createdAt
      },
      token
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

// User Login with JWT
const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken(user._id);

    // Respond with user data
    res.status(200).json({
      message: 'Login successful',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        addresses: user.addresses,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

// Get a user by ID (Protected)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Get all users (Protected)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
};

module.exports = {
  userSignup,
  userLogin,
  getAllUsers,
  getUserById,
};
