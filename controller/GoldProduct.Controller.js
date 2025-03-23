const GoldProduct = require('../models/GoldProduct.model');
const { cloudinary } = require('../config/cloudinary');

const addGoldProduct = async (req, res) => {
    try {
        const { name, category, netWeight, grossWeight, description } = req.body;

        // Convert weights to numbers
        // const parsedNetWeight = parseFloat(netWeight);
        // const parsedGrossWeight = parseFloat(grossWeight);
        
        // Check for NaN or invalid values
        // if (isNaN(parsedNetWeight) || isNaN(parsedGrossWeight)) {
        //     return res.status(400).json({ message: "Invalid net weight or gross weight" });
        // }
        let coverImageUrl = "";
        let imageUrls = [];

        // Image upload handling
        if (req.files) {
            if (req.files.coverImage && req.files.coverImage.length > 0) {
                const coverUploadResult = await cloudinary.uploader.upload(
                    req.files.coverImage[0].path,
                    { folder: "gold_products" }
                );
                coverImageUrl = coverUploadResult.secure_url;
            }

            if (req.files.images && req.files.images.length > 0) {
                const imageUploadPromises = req.files.images.map(image =>
                    cloudinary.uploader.upload(image.path, { folder: "gold_products" })
                );
                const uploadResults = await Promise.all(imageUploadPromises);
                imageUrls = uploadResults.map(result => result.secure_url);
            }
        }

        // Create new product
        const newProduct = new GoldProduct({
            name,
            category,
            netWeight,

            grossWeight,
            description,
            coverImage: coverImageUrl,
            images: imageUrls,
        });

        await newProduct.save();
        res.status(201).json({ message: "Product added successfully!", product: newProduct });

    } catch (error) {
        console.error("🔥 Error in addGoldProduct:", error);
        res.status(500).json({ message: "Server error", error: error.message || error });
    }
};

const updateGoldProduct = async (req, res) => {
    try {
        const { name, category, netWeight, grossWeight, description, isAvailable } = req.body;

        let imageUrls = req.body.images || [];
        let coverImageUrl = req.body.coverImage || "";

        if (req.files && req.files.length > 0) {
            const imageUploadPromises = req.files.map(file =>
                cloudinary.uploader.upload(file.path, { folder: 'gold_products', resource_type: 'image' })
            );

            const uploadResults = await Promise.all(imageUploadPromises);
            imageUrls = uploadResults.map(result => result.secure_url);

            if (!coverImageUrl && imageUrls.length > 0) {
                coverImageUrl = imageUrls[0];
            }
        }

        const updatedProduct = await GoldProduct.findByIdAndUpdate(
            req.params.id,
            { 
                name,
                category,
                netWeight: Number(netWeight),
                grossWeight: Number(grossWeight),
                description,
                coverImage: coverImageUrl,
                images: imageUrls,
                isAvailable
            },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated", product: updatedProduct });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const getAllGoldProducts = async (req, res) => {
    try {
        const products = await GoldProduct.find().populate('category');
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const getGoldProductById = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id).populate('category');
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const deleteGoldProduct = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        await Promise.all(product.images.map(async (imageUrl) => {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`gold_products/${publicId}`);
        }));

        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

module.exports = {
    addGoldProduct,
    getAllGoldProducts,
    getGoldProductById,
    updateGoldProduct,
    deleteGoldProduct
};
