const { cloudinary } = require("../config/cloudinary");
const Everyday = require("../models/EveryDay.model"); // updated model name

// Create a New Everyday Item
const createEveryday = async (req, res) => {
  try {
    const { image, name, description } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "everyday",
      });
      imageUrl = result.secure_url;
    }

    const newEveryday = new Everyday({
      name,
      description,
      image: imageUrl,
    });

    await newEveryday.save();
    res.status(201).json({
      message: "Item created successfully",
      everyday: newEveryday,
    });
  } catch (error) {
    console.error("Error in createEveryday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Everyday Items
const getAllEveryday = async (req, res) => {
  try {
    const items = await Everyday.find();

    if (!items.length) {
      return res.status(404).json({ message: "No items found" });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Error in getAllEveryday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Everyday Item by ID
const getEverydayById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Everyday.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error in getEverydayById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Everyday Item
const updateEveryday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "everyday",
      });
      imageUrl = result.secure_url;
    }

    const updatedItem = await Everyday.findByIdAndUpdate(
      id,
      {
        name,
        description,
        image: imageUrl,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Item updated successfully",
      everyday: updatedItem,
    });
  } catch (error) {
    console.error("Error in updateEveryday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Everyday Item
const deleteEveryday = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Everyday.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error in deleteEveryday:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createEveryday,
  getAllEveryday,
  getEverydayById,
  updateEveryday,
  deleteEveryday,
};
