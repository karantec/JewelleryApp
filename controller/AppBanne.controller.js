const { cloudinary } = require("../config/cloudinary");
const AppBanner = require("../models/AppBanner");

// Create a New App Banner
const createAppBanner = async (req, res) => {
  try {
    const { image } = req.body;

    let imageUrl = image;
    if (image && !image.startsWith("http")) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "AppBanners",
      });
      imageUrl = result.secure_url;
    }

    const newBanner = new AppBanner({
      image: imageUrl,
    });

    await newBanner.save();
    res.status(201).json({
      message: "Banner created successfully",
      banner: newBanner,
    });
  } catch (error) {
    console.error("Error in createAppBanner:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get All App Banners
const getAppBanners = async (req, res) => {
  try {
    const items = await AppBanner.find();

    if (!items.length) {
      return res.status(404).json({ message: "No banners found" });
    }

    res.status(200).json(items);
  } catch (error) {
    console.error("Error in getAppBanners:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Single App Banner by ID
const getAppBannerById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await AppBanner.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json(item);
  } catch (error) {
    console.error("Error in getAppBannerById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update App Banner
const updateAppBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const { image } = req.body;

    let imageUrl = image;
    if (image && !image.startsWith("http")) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "AppBanners",
      });
      imageUrl = result.secure_url;
    }

    const updatedItem = await AppBanner.findByIdAndUpdate(
      id,
      {
        image: imageUrl,
      },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedItem,
    });
  } catch (error) {
    console.error("Error in updateAppBanner:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete App Banner
const deleteAppBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedItem = await AppBanner.findByIdAndDelete(id);

    if (!deletedItem) {
      return res.status(404).json({ message: "Banner not found" });
    }

    res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAppBanner:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createAppBanner,
  getAppBanners,
  getAppBannerById,
  updateAppBanner,
  deleteAppBanner,
};
