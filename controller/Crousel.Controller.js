const { cloudinary } = require("../config/cloudinary");
const Crousel = require("../models/Crousel.model");

// Create a New Carousel Item with Image Upload
const createCrousel = async (req, res) => {
  try {
    const { title, content, image } = req.body;

    // Create a new carousel item with the provided data
    const newCrousel = new Crousel({
      title,
      content,
      image,
    });

    await newCrousel.save();
    res.status(201).json({
      message: "Carousel item created successfully",
      crousel: newCrousel,
    });
  } catch (error) {
    console.error("Error in createCrousel:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Carousel Items
const getAllCrousels = async (req, res) => {
  try {
    const crousels = await Crousel.find();

    if (!crousels.length) {
      return res.status(404).json({ message: "No carousel items found" });
    }

    res.status(200).json(crousels);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Carousel Item by ID
const getCrouselById = async (req, res) => {
  try {
    const { id } = req.params;
    const crousel = await Crousel.findById(id);

    if (!crousel) {
      return res.status(404).json({ message: "Carousel item not found" });
    }

    res.status(200).json(crousel);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Carousel Item with Image Upload
const updateCrousel = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, image } = req.body;
    let imageUrl = "";

    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "crousels",
      });
      imageUrl = result.secure_url;
    }

    const updatedCrousel = await Crousel.findByIdAndUpdate(
      id,
      {
        title,
        content,
        image: imageUrl || image, // Use existing image if no new upload
      },
      { new: true }
    );

    if (!updatedCrousel) {
      return res.status(404).json({ message: "Carousel item not found" });
    }

    res.status(200).json({
      message: "Carousel item updated successfully",
      updatedCrousel,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a Carousel Item
const deleteCrousel = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCrousel = await Crousel.findByIdAndDelete(id);

    if (!deletedCrousel) {
      return res.status(404).json({ message: "Carousel item not found" });
    }

    res.status(200).json({ message: "Carousel item deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createCrousel,
  getAllCrousels,
  getCrouselById,
  updateCrousel,
  deleteCrousel,
};
