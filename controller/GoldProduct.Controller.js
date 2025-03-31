const GoldProduct = require('../models/GoldProduct.model');
const { cloudinary } = require('../config/cloudinary');
const GoldPrice = require('../models/GoldPrice.model');

const addGoldProduct = async (req, res) => {
    try {
        const { 
            name, 
            category, 
            netWeight, 
            grossWeight,
            makingcharge, 
            description
        } = req.body;
        
        // Validate numeric inputs
        if (!netWeight || isNaN(Number(netWeight))) {
            return res.status(400).json({message: "Valid netWeight is required"});
        }

        // Handle carat specifically - extract from body and validate
        const carats = req.body.carat ? String(req.body.carat).trim() : "";
        console.log("Carat value:", carats);
        
        if (!carats || !["24K", "22K", "18K"].includes(carats)) {
            return res.status(400).json({ message: "Valid carat value is required" });
        }
        
        // Convert carat string to number properly
        let caratNum;
        if (carats === "24K") caratNum = 24;
        else if (carats === "22K") caratNum = 22;
        else if (carats === "18K") caratNum = 18;
        else caratNum = 0; // Fallback, though validation should prevent this

        if (!makingcharge || isNaN(Number(makingcharge))) {
            return res.status(400).json({message: "Valid makingcharge is required"});
        }
        
        // Check for existing product
        const existingProduct = await GoldProduct.findOne({name: name});
        if(existingProduct){
            return res.status(400).json({message: "Product already exists"});
        }
        
        // Get the latest gold price from GoldPrice model
        const latestGoldPrice = await GoldPrice.findOne().sort({ _id: -1 });
        if (!latestGoldPrice) {
            return res.status(404).json({message: "Gold price not found. Please add gold price first."});
        }
        
        const TodayGoldPricePerGram = latestGoldPrice.TodayGoldPricePerGram;
        
        // Validate gold price
        if (!TodayGoldPricePerGram || isNaN(Number(TodayGoldPricePerGram))) {
            return res.status(400).json({message: "Valid gold price is not available"});
        }
        
        // Log values for debugging
        console.log({
            netWeight: Number(netWeight),
            caratNum,
            makingcharge: Number(makingcharge),
            TodayGoldPricePerGram
        });
        
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
        
        // Ensure all values are properly converted to numbers
        const todayPriceNum = Number(TodayGoldPricePerGram);
        const netWeightNum = Number(netWeight);
        const makingchargeNum = Number(makingcharge);
        
        const dailyPrice = (caratNum/24) * todayPriceNum;
        const Netcharge = dailyPrice + makingchargeNum;
        
        // Calculate total price with explicit Number conversions
        const totalPrice = netWeightNum * Netcharge;
        
        // Log calculated values
        console.log({
            dailyPrice,
            Netcharge,
            totalPrice
        });
        
        // Final validation
        if (isNaN(totalPrice)) {
            return res.status(400).json({
                message: "Calculation error. Please check your input values.",
                debug: {
                    netWeight: netWeightNum,
                    carat: caratNum,
                    makingcharge: makingchargeNum,
                    TodayGoldPricePerGram: todayPriceNum,
                    dailyPrice,
                    Netcharge
                }
            });
        }
        
        // Create new product with reference to gold price
        const newProduct = new GoldProduct({
            name,
            category,
            netWeight: netWeightNum,
            grossWeight,
            makingcharge: makingchargeNum,
            description,
            carat: carats, // Store the original string format (e.g., "24K")
            goldPriceRef: latestGoldPrice._id,
            TodayGoldPricePerGram: todayPriceNum,
            coverImage: coverImageUrl,
            images: imageUrls,
            // totalPrice,
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
const updateGoldProduct = async (req, res) => {
    try {
        const { 
            name, 
            category, 
            netWeight, 
            grossWeight, 
            description, 
            carat, 
            TodayGoldPricePerGram, 
            makingcharge 
        } = req.body;

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

        // Ensure numeric values
        const netWeightNum = Number(netWeight);
        const goldRateNum = Number(TodayGoldPricePerGram);
        const makingChargeNum = Number(makingcharge);

        // Calculate total price
        const totalPrice = netWeightNum * (goldRateNum + makingChargeNum);

        const updatedProduct = await GoldProduct.findByIdAndUpdate(
            req.params.id,
            { 
                name,
                category,
                netWeight: netWeightNum,
                grossWeight: Number(grossWeight),
                description,
                carat,
                TodayGoldPricePerGram: goldRateNum,
                makingcharge: makingChargeNum,
                coverImage: coverImageUrl,
                images: imageUrls,
                totalPrice,  // Updated total price
            },
            { new: true }
        );

        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });

        res.status(200).json({ message: "Product updated", product: updatedProduct });

    } catch (error) {
        console.error("🔥 Error in updateGoldProduct:", error);
        res.status(500).json({ message: "Server error", error: error.message || error });
    }
};
const getAllGoldProducts = async (req, res) => {
    try {
      // Fetch all products
      const products = await GoldProduct.find().populate('category');
  
      // Get the latest gold price
      const latestGoldPrice = await GoldPrice.findOne().sort({ createdAt: -1 });
      const currentGoldPrice = latestGoldPrice?.TodayGoldPricePerGram || 0;
  
      // Map through products and add calculated prices
      const productsWithPrices = products.map(product => {
        const productObj = product.toObject();
  
        // Calculate price if we have the necessary data
        if (product.netWeight && product.makingcharge && product.carat) {
          let adjustedGoldPrice = currentGoldPrice;
  
          // Adjust gold price based on carat
          if (product.carat === '22K') {
            adjustedGoldPrice = (currentGoldPrice * 22) / 24;
          } else if (product.carat === '18K') {
            adjustedGoldPrice = (currentGoldPrice * 18) / 24;
          }
  
          // Calculate total price
          const totalPrice = product.netWeight * (adjustedGoldPrice + parseFloat(product.makingcharge));
          productObj.calculatedPrice = totalPrice.toFixed(2);
        }
  
        return productObj;
      });
  
      // Return response with the product data and current gold price
      res.status(200).json({
        products: productsWithPrices,
        currentGoldPrice: currentGoldPrice
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ message: "Server error", error: error.message });
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
