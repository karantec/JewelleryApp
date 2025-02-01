const GoldProduct = require('../models/GoldProduct.model');
const { cloudinary } = require('../config/cloudinary');

const addGoldProduct = async (req, res) => {
    try {
        const { name, category, price, discountedPrice, weight, karat, description } = req.body;

        // Validate required fields
        if (!name || !category || !price || !weight || !karat) {
            return res.status(400).json({ message: "All fields are required!" });
        }

        // Check if category and karat are valid
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

        // Handle file uploads if files are present using the expected fields
        if (req.files) {
            // Process cover image file if provided
            if (req.files.coverImage && req.files.coverImage.length > 0) {
                const coverUploadResult = await cloudinary.uploader.upload(req.files.coverImage[0].path, { folder: "gold_products" });
                coverImageUrl = coverUploadResult.secure_url;
            }

            // Process additional images if provided
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
            price: Number(price),
            discountedPrice: discountedPrice ? Number(discountedPrice) : null,
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



// ✅ Get All Gold Products
const getAllGoldProducts = async (req, res) => {
    try {
        const products = await GoldProduct.find();
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Get a Single Gold Product by ID
const getGoldProductById = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        res.status(200).json(product);
    } catch (error) {
        res.status(500).json({ message: "Server error", error });
    }
};

// ✅ Update a Gold Product
const updateGoldProduct = async (req, res) => {
    try {
        const { name, category, price, discountedPrice, weight, karat, description, inStock } = req.body;

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
                price, 
                discountedPrice: discountedPrice ? Number(discountedPrice) : null,
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

// ✅ Delete a Gold Product
const deleteGoldProduct = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Delete images from Cloudinary
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

// ✅ Search & Filter Gold Products
const searchAndFilterGoldProducts = async (req, res) => {
    try {
        const { search, category, karat, minPrice, maxPrice, sort } = req.query;
        let query = {};

        // 🔍 Case-insensitive search by name
        if (search) query.name = { $regex: search, $options: 'i' };

        // 🔍 Case-insensitive category filter
        if (category) query.category = { $regex: category, $options: 'i' };

        // 💎 Filter by karat
        if (karat) query.karat = karat;

        // 💰 Price range filtering
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

        // 🔀 Sorting logic
        let sortQuery = {};
        if (sort === 'price_asc') sortQuery.price = 1;
        if (sort === 'price_desc') sortQuery.price = -1;
        if (sort === 'discountedPrice_asc') sortQuery.discountedPrice = 1;
        if (sort === 'discountedPrice_desc') sortQuery.discountedPrice = -1;

        // 🔄 Fetch products
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
