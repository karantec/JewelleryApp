const { cloudinary } = require("../config/cloudinary");
const Best = require("../models/Best.Selling.model");

// Create a New Best Selling Item
const createBest = async (req, res) => {
  try {
    const { image, name, description } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "best-selling",
      });
      imageUrl = result.secure_url;
    }

    const newBest = new Best({
      name,
      description,
      image: imageUrl,
    });

    await newBest.save();
    res.status(201).json({
      message: "Best Selling item created successfully",
      bestSelling: newBest,
    });
  } catch (error) {
    console.error("Error in createBest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Best Selling Items
const getAllBest = async (req, res) => {
  try {
    const bestItems = await Best.find();

    if (!bestItems.length) {
      return res.status(404).json({ message: "No best selling items found" });
    }

    res.status(200).json(bestItems);
  } catch (error) {
    console.error("Error in getAllBest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Best Selling Item by ID
const getBestById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Best.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error in getBestById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Best Selling Item
const updateBest = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "best-selling",
      });
      imageUrl = result.secure_url;
    }

    const updatedBest = await Best.findByIdAndUpdate(
      id,
      {
        name,
        description,
        image: imageUrl,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!updatedBest) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({
      message: "Best Selling item updated successfully",
      updatedBest,
    });
  } catch (error) {
    console.error("Error in updateBest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Best Selling Item
const deleteBest = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Best.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error in deleteBest:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createBest,
  getAllBest,
  getBestById,
  updateBest,
  deleteBest,
};
