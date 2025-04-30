const About = require("../models/About.model");

// Create
const createAbout = async (req, res) => {
  try {
    const {
      title,
      subtitle,
      description1,
      description2,
      description3,
      Image1,
      Image2,
      Image3,
    } = req.body;

    const newAbout = new About({
      title,
      subtitle,
      description1,
      description2,
      description3,
      Image1,
      Image2,
      Image3,
    });

    await newAbout.save();

    res.status(201).json({
      message: "About created successfully",
      about: newAbout,
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
const getAllAbout = async (req, res) => {
  try {
    const abouts = await About.find();

    if (!abouts.length) {
      return res.status(404).json({
        message: "No About found",
      });
    }

    res.status(200).json({
      message: "Abouts fetched successfully",
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

// Get By ID
const getAboutById = async (req, res) => {
  try {
    const { id } = req.params;
    const about = await About.findById(id);

    if (!about) {
      return res.status(404).json({
        message: "About not found",
      });
    }

    res.status(200).json({
      message: "About fetched successfully",
      about,
    });
  } catch (error) {
    console.error("Error in getAboutById:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update
const updateAbout = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      subtitle,
      description1,
      description2,
      description3,
      Image1,
      Image2,
      Image3,
    } = req.body;

    const updatedAbout = await About.findByIdAndUpdate(
      id,
      {
        title,
        subtitle,
        description1,
        description2,
        description3,
        Image1,
        Image2,
        Image3,
      },
      { new: true, runValidators: true }
    );

    if (!updatedAbout) {
      return res.status(404).json({
        message: "About not found",
      });
    }

    res.status(200).json({
      message: "About updated successfully",
      about: updatedAbout,
    });
  } catch (error) {
    console.error("Error in updateAbout:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete
const deleteAbout = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAbout = await About.findByIdAndDelete(id);

    if (!deletedAbout) {
      return res.status(404).json({
        message: "About not found",
      });
    }

    res.status(200).json({
      message: "About deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteAbout:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createAbout,
  getAllAbout,
  getAboutById,
  updateAbout,
  deleteAbout,
};
