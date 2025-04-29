const { cloudinary } = require("../config/cloudinary");
const Features = require("../models/Features.model copy");

// Create a New Feature
const createFeature = async (req, res) => {
  try {
    const { image, name, description } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "features",
      });
      imageUrl = result.secure_url;
    }

    const newFeature = new Features({
      name,
      description,
      image: imageUrl,
    });

    await newFeature.save();
    res.status(201).json({
      message: "Feature created successfully",
      feature: newFeature,
    });
  } catch (error) {
    console.error("Error in createFeature:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Features
const getAllFeatures = async (req, res) => {
  try {
    const features = await Features.find();

    if (!features.length) {
      return res.status(404).json({ message: "No features found" });
    }

    res.status(200).json(features);
  } catch (error) {
    console.error("Error in getAllFeatures:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Feature by ID
const getFeatureById = async (req, res) => {
  try {
    const { id } = req.params;
    const feature = await Features.findById(id);

    if (!feature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.status(200).json(feature);
  } catch (error) {
    console.error("Error in getFeatureById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Feature
const updateFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "features",
      });
      imageUrl = result.secure_url;
    }

    const updatedFeature = await Features.findByIdAndUpdate(
      id,
      {
        name,
        description,
        image: imageUrl,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedFeature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.status(200).json({
      message: "Feature updated successfully",
      updatedFeature,
    });
  } catch (error) {
    console.error("Error in updateFeature:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Feature
const deleteFeature = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFeature = await Features.findByIdAndDelete(id);

    if (!deletedFeature) {
      return res.status(404).json({ message: "Feature not found" });
    }

    res.status(200).json({ message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error in deleteFeature:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createFeature,
  getAllFeatures,
  getFeatureById,
  updateFeature,
  deleteFeature,
};
