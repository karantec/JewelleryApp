// const { cloudinary } = require("../config/cloudinary");
const JewelleryCategory = require("../models/Category.Model");

// **Create a New Blog Post with Image Upload**
const createCategory = async (req, res) => {
  try {
    const { title } = req.body;  // Extract title correctly
    const image = req.files?.images ? req.files.images[0].path : null;  // Extract image path
    
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

// // **Get Single Blog Post by ID**
// const getCategoryById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const Categorys = await Category.findById(id);

//     if (!Categorys) {
//       return res.status(404).json({ message: "Blog post not found" });
//     }

//     res.status(200).json(Categorys);
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // **Update Blog Post with Image Upload**
// const updateCategory = async (req, res) => {
//     try {
//       const { id } = req.params;
//       const { categoryname, Image } = req.body;
//       let imageUrl = Image; // Keep the existing Image if not updated
  
//       if (Image) {
//         const result = await cloudinary.uploader.upload(Image, { folder: "Category" });
//         imageUrl = result.secure_url;
//       }
  
//       const updatedCategory = await Category.findByIdAndUpdate(
//         id,
//         { categoryname, Image: imageUrl }, // Ensure Image is updated
//         { new: true }
//       );
  
//       if (!updatedCategory) {
//         return res.status(404).json({ message: "Category post not found" });
//       }
  
//       res.status(200).json({ message: "Category post updated successfully", updatedCategory });
//     } catch (error) {
//       console.error("Error:", error);
//       res.status(500).json({ message: "Server error", error: error.message });
//     }
//   };
  

// // **Delete a Blog Post**
// const deleteCategory = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const deletedCategory = await Category.findByIdAndDelete(id);

//     if (!deletedCategory) {
//       return res.status(404).json({ message: "Catag post not found" });
//     }

//     res.status(200).json({ message: "Category post deleted successfully" });
//   } catch (error) {
//     console.error("Error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

module.exports = { createCategory, getAllCatgory
}
