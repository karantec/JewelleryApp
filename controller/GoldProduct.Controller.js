const GoldProduct = require('../models/GoldProduct.model');
const { cloudinary } = require('../config/cloudinary');
const GoldPriceService = require('../services/goldPriceService'); // Add this line
const addGoldProduct = async (req, res) => {
    try {
        const { name, category, weight, karat, description } = req.body;

        // Validate required fields
        if (!name || !category || !weight || !karat) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        const validCategories = ["Bracelets", "Earrings", "Necklaces", "Shop Earrings", "Wedding & Bridal"];
        const validKarats = ["14K", "18K", "22K", "24K"];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                message: `Invalid category. Must be one of: ${validCategories.join(", ")}`
            });
        }

        if (!validKarats.includes(karat)) {
            return res.status(400).json({
                message: `Invalid karat. Must be one of: ${validKarats.join(", ")}`
            });
        }

        let coverImageUrl = "";
        let imageUrls = [];

        // Handle file uploads if files are present
        if (req.files) {
            if (req.files.coverImage && req.files.coverImage.length > 0) {
                const coverUploadResult = await cloudinary.uploader.upload(req.files.coverImage[0].path, { folder: "gold_products" });
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

        // Calculate current price based on gold rate
        const currentGoldPrice = await GoldPriceService.fetchGoldPrice();
        const pricePerGramForKarat = GoldPriceService.calculatePriceByKarat(currentGoldPrice, karat);
        const basePrice = pricePerGramForKarat * Number(weight);
        
        // Add making charges (10%)
        const makingCharges = basePrice * 0.10;
        const finalPrice = basePrice + makingCharges;
        
        // Calculate discounted price (5% discount)
        const discountedPrice = finalPrice * 0.95;

        // Create new product
        const newProduct = new GoldProduct({
            name,
            category,
            price: Math.round(finalPrice),
            discountedPrice: Math.round(discountedPrice), // Ensure this is set correctly
            weight: Number(weight),
            karat,
            description,
            coverImage: coverImageUrl,
            images: imageUrls,
            inStock: true
        });

        await newProduct.save();
        res.status(201).json({
            message: "Product added successfully!",
            product: newProduct
        });

    } catch (error) {
        console.error("🔥 Error in addGoldProduct:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message || error
        });
    }
};

// Update the updateGoldProduct function
const updateGoldProduct = async (req, res) => {
    try {
        const { name, category, weight, karat, description, inStock } = req.body;

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

        // Calculate current price based on gold rate
        const currentGoldPrice = await GoldPriceService.fetchGoldPrice();
        const pricePerGramForKarat = GoldPriceService.calculatePriceByKarat(currentGoldPrice, karat);
        const basePrice = pricePerGramForKarat * Number(weight);
        
        // Add making charges (10%)
        const makingCharges = basePrice * 0.10;
        const finalPrice = basePrice + makingCharges;
        
        // Calculate discounted price (5% discount)
        const discountedPrice = finalPrice * 0.95;

        const updatedProduct = await GoldProduct.findByIdAndUpdate(
            req.params.id,
            { 
                name, 
                category, 
                price: Math.round(finalPrice),
                discountedPrice: Math.round(discountedPrice),
                weight, 
                karat, 
                description, 
                coverImage: coverImageUrl, 
                images: imageUrls, 
                inStock 
            },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated", product: updatedProduct });

    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// Keep other functions the same
const getAllGoldProducts = async (req, res) => {
    try {
        const products = await GoldProduct.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

const getGoldProductById = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id);
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

const searchAndFilterGoldProducts = async (req, res) => {
    try {
        const { search, category, karat, minPrice, maxPrice, sort } = req.query;
        let query = {};

        if (search) query.name = { $regex: search, $options: 'i' };
        if (category) query.category = { $regex: category, $options: 'i' };
        if (karat) query.karat = karat;

        if (minPrice || maxPrice) {
            query.$or = [
                { price: {} },
                { discountedPrice: {} }
            ];
            if (minPrice) {
                query.$or[0].price.$gte = Number(minPrice);
                query.$or[1].discountedPrice.$gte = Number(minPrice);
            }
            if (maxPrice) {
                query.$or[0].price.$lte = Number(maxPrice);
                query.$or[1].discountedPrice.$lte = Number(maxPrice);
            }
        }

        let sortQuery = {};
        if (sort === 'price_asc') sortQuery.price = 1;
        if (sort === 'price_desc') sortQuery.price = -1;
        if (sort === 'discountedPrice_asc') sortQuery.discountedPrice = 1;
        if (sort === 'discountedPrice_desc') sortQuery.discountedPrice = -1;

        const products = await GoldProduct.find(query).sort(Object.keys(sortQuery).length ? sortQuery : undefined);

        res.status(200).json(products);
    } catch (error) {
        console.error("Search API Error:", error);
        res.status(500).json({ message: "Server error", error: error.message || error });
    }
};

module.exports = {
    addGoldProduct,
    getAllGoldProducts,
    getGoldProductById,
    updateGoldProduct,
    deleteGoldProduct,
    searchAndFilterGoldProducts
};