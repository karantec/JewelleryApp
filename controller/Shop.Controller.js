const { cloudinary } = require("../config/cloudinary");
const Shop = require("../models/ShopCrousel.model"); // Import your correct model

// **Create a New Shop Entry**
const createShop = async (req, res) => {
  try {
    const {
      title,
      headline,
      shopTitle,
      subtext,
      buttonText,
      buttonLink,
      image,
    } = req.body;
    let imageUrl = "";

    // Upload image to Cloudinary if provided
    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "shop",
      });
      imageUrl = result.secure_url;
    }

    const newShop = new Shop({
      title,
      headline,
      shopTitle,
      subtext,
      buttonText,
      buttonLink,
      image: imageUrl,
    });

    await newShop.save();
    res
      .status(201)
      .json({ message: "Shop entry created successfully", shop: newShop });
  } catch (error) {
    console.error("Error in createShop:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get All Shop Entries**
const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find();

    if (!shops.length) {
      return res.status(404).json({ message: "No shop entries found" });
    }

    res.status(200).json(shops);
  } catch (error) {
    console.error("Error in getAllShops:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get Single Shop Entry by ID**
const getShopById = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({ message: "Shop entry not found" });
    }

    res.status(200).json(shop);
  } catch (error) {
    console.error("Error in getShopById:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Update Shop Entry**
const updateShop = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      headline,
      shopTitle,
      subtext,
      buttonText,
      buttonLink,
      image,
    } = req.body;
    let imageUrl = "";

    if (image) {
      const result = await cloudinary.uploader.upload(image, {
        folder: "shop",
      });
      imageUrl = result.secure_url;
    }

    const updatedShop = await Shop.findByIdAndUpdate(
      id,
      {
        title,
        headline,
        shopTitle,
        subtext,
        buttonText,
        buttonLink,
        image: imageUrl,
      },
      { new: true }
    );

    if (!updatedShop) {
      return res.status(404).json({ message: "Shop entry not found" });
    }

    res
      .status(200)
      .json({ message: "Shop entry updated successfully", shop: updatedShop });
  } catch (error) {
    console.error("Error in updateShop:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Delete a Shop Entry**
const deleteShop = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedShop = await Shop.findByIdAndDelete(id);

    if (!deletedShop) {
      return res.status(404).json({ message: "Shop entry not found" });
    }

    res.status(200).json({ message: "Shop entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteShop:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createShop,
  getAllShops,
  getShopById,
  updateShop,
  deleteShop,
};
