const { cloudinary } = require("../config/cloudinary");
const Related = require("../models/RelatedProduct.Model");

// Create a New Related Product
const createRelated = async (req, res) => {
  try {
    const { image, name, description } = req.body;

    let imageUrl = image;
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "RelatedProduct",
      });
      imageUrl = result.secure_url;
    }

    const newRelated = new Related({
      name,
      description,
      image: imageUrl,
    });

    await newRelated.save();
    res.status(201).json({
      message: "Item created successfully",
      related: newRelated,
    });
  } catch (error) {
    console.error("Error in createRelated:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All Related Products
const getRelated = async (req, res) => {
  try {
    const items = await Related.find();

    if (!items.length) {
      return res.status(404).json({ message: "No items found" });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Error in getRelated:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single Related Product by ID
const getRelatedById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Related.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error in getRelatedById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Related Product
const updateRelated = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image } = req.body;

    let imageUrl = image;
    if (image && !image.startsWith("http")) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "RelatedProduct",
      });
      imageUrl = result.secure_url;
    }

    const updatedItem = await Related.findByIdAndUpdate(
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
      related: updatedItem,
    });
  } catch (error) {
    console.error("Error in updateRelated:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Related Product
const deleteRelated = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await Related.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.status(200).json({ message: "Item deleted successfully" });
  } catch (error) {
    console.error("Error in deleteRelated:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createRelated,
  getRelated,
  getRelatedById,
  updateRelated,
  deleteRelated,
};
