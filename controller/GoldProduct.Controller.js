const GoldProduct = require('../models/GoldProduct.model');
const Pricing = require('../models/Price.model');
const { cloudinary } = require('../config/cloudinary');

const addGoldProduct = async (req, res) => {
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    try {
        const {
            name,
            category,
            netWeight,
            grossWeight,
            makingcharge,
            description,
            carat
        } = req.body;

        if (!netWeight || isNaN(Number(netWeight))) {
            return res.status(400).json({message: "Valid netWeight is required"});
        }
        
        if (!grossWeight || isNaN(Number(grossWeight))) {
            return res.status(400).json({message: "Valid grossWeight is required"});
        }
        
        if (!makingcharge || isNaN(Number(makingcharge))) {
            return res.status(400).json({message: "Valid makingCharge percentage is required"});
        }
        
        const validCarats = ["24K", "22K", "18K"];
        if (!carat || !validCarats.includes(carat)) {
            return res.status(400).json({ message: "Valid carat value is required (24K, 22K, or 18K)" });
        }
        
        const existingProduct = await GoldProduct.findOne({name: name});
        if(existingProduct){
            return res.status(400).json({message: "Product already exists"});
        }
        
        const latestPrice = await Pricing.findOne({ Carat: carat }).sort({ createdAt: -1 });
        if (!latestPrice) {
            return res.status(404).json({message: `Price not found for ${carat}. Please add pricing first.`});
        }
        
        let coverImageUrl = "";
        let imageUrls = [];
        
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
        
        const newProduct = new GoldProduct({
            name,
            category,
            netWeight: Number(netWeight),
            grossWeight: Number(grossWeight),
            makingcharge: Number(makingcharge),
            description,
            carat,
            coverImage: coverImageUrl,
            images: imageUrls
        });
        
        await newProduct.save();
        
        const calculateTotalPrice = (netWeight, pricePerGram, makingChargePercentage) => {
            const goldPrice = netWeight * pricePerGram;
            const makingChargeAmount = (goldPrice * makingChargePercentage) / 100;
            const totalPrice = goldPrice + makingChargeAmount;
            return { goldPrice, makingChargeAmount, totalPrice };
        };
        
        const priceDetails = calculateTotalPrice(
            Number(newProduct.netWeight),
            // Number(newProduct.pricePerGram),
            Number(newProduct.makingcharge)
        );
        
        const responseProduct = newProduct.toObject();
        responseProduct.priceDetails = priceDetails;
        
        res.status(201).json({ 
            message: "Product added successfully!", 
            product: responseProduct
        });
    } catch (error) {
        console.error("🔥 Error in addGoldProduct:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message || error
        });
    }
};


const updateGoldProduct = async (req, res) => {
    try {
        const { name, category, netWeight, grossWeight, description, carat, makingcharge } = req.body;
        const product = await GoldProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        let coverImageUrl = product.coverImage;
        let imageUrls = product.images;

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

        const updatedProduct = await GoldProduct.findByIdAndUpdate(
            req.params.id,
            { name, category, netWeight, grossWeight, makingcharge, description, carat, coverImage: coverImageUrl, images: imageUrls },
            { new: true }
        );
        
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (error) {
        console.error("🔥 Error in updateGoldProduct:", error);
        res.status(500).json({ message: "Server error", error: error.message || error });
    }
};

const deleteGoldProduct = async (req, res) => {
    try {
        const product = await GoldProduct.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        if (product.coverImage) {
            const publicId = product.coverImage.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(`gold_products/${publicId}`);
        }
        
        if (product.images && product.images.length > 0) {
            await Promise.all(product.images.map(async (imageUrl) => {
                const publicId = imageUrl.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(`gold_products/${publicId}`);
            }));
        }
        
        await product.deleteOne();
        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("🔥 Error deleting product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getGoldProducts = async (req, res) => {
    try {
        // Fetch all gold products
        const products = await GoldProduct.find().sort({ createdAt: -1 });
        
        if (!products || products.length === 0) {
            return res.status(404).json({ message: "No products found" });
        }
        
        // Fetch latest prices for all carats to avoid multiple database calls
        const latestPrices = await Pricing.aggregate([
            { 
                $sort: { createdAt: -1 } 
            },
            {
                $group: {
                    _id: "$Carat",
                    TodayPricePerGram: { $first: "$TodayPricePerGram" },
                    updatedAt: { $first: "$createdAt" }
                }
            }
        ]);
        
        // Convert array to object for easy lookup
        const pricesByCarat = {};
        latestPrices.forEach(price => {
            pricesByCarat[price._id] = price.TodayPricePerGram;
        });
        
        // Calculate current prices for all products
        const productsWithPrices = products.map(product => {
            const productObj = product.toObject();
            const caratPrice = pricesByCarat[product.carat] || 0;
            
            // Calculate price components
            const goldPrice = product.netWeight * caratPrice;
            const makingChargeAmount = (goldPrice * product.makingcharge) / 100;
            const totalPrice = goldPrice + makingChargeAmount;
            
            // Add price details to product
            productObj.priceDetails = {
                goldPrice: goldPrice.toFixed(2),
                makingChargeAmount: makingChargeAmount.toFixed(2),
                totalPrice: totalPrice.toFixed(2),
                pricePerGram: caratPrice
            };
            
            return productObj;
        });
        
        res.status(200).json({
            count: productsWithPrices.length,
            products: productsWithPrices
        });
    } catch (error) {
        console.error("🔥 Error in getGoldProducts:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message || error
        });
    }
};


const getGoldProductById = async (req, res) => {
    try {
        // Validate product ID
        const { id } = req.params;
        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid product ID" });
        }

        // Fetch product with populated category
        const product = await GoldProduct.findById(id).populate("category");
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Return only the editable fields
        const productResponse = {
            name: product.name,
            description: product.description,
            category: product.category,
            image: product.image,
            netWeight: product.netWeight,
            grossWeight: product.grossWeight,
            makingCharge: product.makingCharge,
            pricePerGram: product.pricePerGram
        };

        res.status(200).json(productResponse);
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


// const deleteGoldProduct = async (req, res) => {
//     try {
//         const product = await GoldProduct.findById(req.params.id);
//         if (!product) return res.status(404).json({ message: "Product not found" });

//         // Delete images from cloudinary
//         if (product.coverImage) {
//             const publicId = product.coverImage.split('/').pop().split('.')[0];
//             await cloudinary.uploader.destroy(`gold_products/${publicId}`);
//         }

//         if (product.images && product.images.length > 0) {
//             await Promise.all(product.images.map(async (imageUrl) => {
//                 const publicId = imageUrl.split('/').pop().split('.')[0];
//                 await cloudinary.uploader.destroy(`gold_products/${publicId}`);
//             }));
//         }

//         await product.deleteOne();
//         res.status(200).json({ message: "Product deleted successfully" });

//     } catch (error) {
//         console.error("Error deleting product:", error);
//         res.status(500).json({ message: "Server error", error: error.message });
//     }
// };



module.exports = {
    addGoldProduct,
    getGoldProducts,
    getGoldProductById,
    updateGoldProduct,
    deleteGoldProduct
};