const mongoose = require('mongoose');

const goldProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    category: { 
        type: String, 
        enum: ['Bracelets', 'Earrings', 'Necklaces', 'Shop Earrings', 'Wedding & Bridal'], 
        required: true 
    },
    price: { type: Number, required: true },
    discountedPrice: { type: Number, default: null }, // New field for discounted price
    weight: { type: Number, required: true },
    karat: { type: String, enum: ['14K', '18K', '22K', '24K'], required: true },
    description: { type: String, trim: true },
    coverImage: { type: String, trim: true }, // Cover image URL
    images: [{ type: String, trim: true }], // Cloudinary URLs stored here
    inStock: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const GoldProduct = mongoose.model('GoldProduct', goldProductSchema);
module.exports = GoldProduct;
