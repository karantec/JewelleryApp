const Support = require("../models/Support.model");

// Create
const createSupport = async (req, res) => {
  try {
    console.log("BODY RECEIVED:", req.body); // <- Debug line
    const { fullName, contactEmail, phoneNumber, supportQuery } = req.body;

    const newAbout = new Support({
      fullName,
      contactEmail, // Fixed field name to match schema
      phoneNumber,
      supportQuery,
    });

    await newAbout.save();

    res.status(201).json({
      message: "Contact created successfully",
    });
  } catch (error) {
    console.error("Error in createAbout:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get All
const getAllSupport = async (req, res) => {
  try {
    const abouts = await Support.find();

    if (!abouts.length) {
      return res.status(404).json({
        message: "No About found",
      });
    }

    res.status(200).json({
      message: "Support fetched successfully",
      abouts,
    });
  } catch (error) {
    console.error("Error in getAllAbout:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createSupport,
  getAllSupport,
};
