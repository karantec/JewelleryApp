// const { cloudinary } = require("../config/cloudinary");
const { cloudinary } = require("../config/cloudinary");
const JewelleryCategory = require("../models/Category.Model");

// **Create a New Blog Post with Image Upload**
const createCategory = async (req, res) => {
  try {
    const { title,image } = req.body;  // Extract title correctly
    
    const newJewellery = new JewelleryCategory({ title, image });
    await newJewellery.save();

    res.status(201).json({ message: "Category created successfully", category: newJewellery });
  } catch (error) {
    console.error("Error in createCategory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllCatgory = async (req, res) => {
  try {
    const Categorys = await JewelleryCategory.find();

    if (!Categorys.length) {
      return res.status(404).json({ message: "No Category posts found" });
    }

    res.status(200).json(Categorys);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Get Single Blog Post by ID**
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const Categorys = await Category.findById(id);

    if (!Categorys) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.status(200).json(Categorys);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// **Update Blog Post with Image Upload**
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, image} = req.body;

    let imageUrl = "";

    // Upload new image if provided
    if (image) {
      const result = await cloudinary.uploader.upload(image, { folder: "products" });
      imageUrl = result.secure_url;
    }

    const updatedProduct = await JewelleryCategory.findByIdAndUpdate(
      id,
      { title, image, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



  

// **Delete a Blog Post**
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await JewelleryCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return res.status(404).json({ message: "Catag post not found" });
    }

    res.status(200).json({ message: "Category post deleted successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { createCategory, getAllCatgory,updateCategory,deleteCategory 
}
