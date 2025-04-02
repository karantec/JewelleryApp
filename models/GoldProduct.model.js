const mongoose = require('mongoose');
const Pricing = require('../models/Price.model');

const goldProductSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    netWeight: {
        type: Number,
        required: [true, "Net weight is required"],
        min: [0, "Net weight cannot be negative"]
    },
    grossWeight: {
        type: Number,
        required: [true, "Gross weight is required"],
        min: [0, "Gross weight cannot be negative"]
    },
    carat: {
        type: String,
        enum: ['24K', '22K', '18K'],
        required: [true, "Carat value is required"]
    },
    // Add reference to the pricing model
    pricingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pricing'
    },
    // Store the price per gram at the time of creation
    pricePerGram: {
        type: Number
    },
    makingcharge: {
        type: Number, // Changed to Number to store percentage value
        required: [true, "Making charge percentage is required"],
        min: [0, "Making charge percentage cannot be negative"]
    },
    description: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
}, { timestamps: true });

// Middleware to fetch price per gram based on carat before saving
goldProductSchema.pre('save', async function(next) {
    try {
        // Find the latest pricing document matching this carat
        const pricing = await Pricing.findOne({ Carat: this.carat }).sort({ createdAt: -1 });
        
        if (pricing) {
            // Store both the reference to the pricing document and the price value
            this.pricingId = pricing._id;
            this.pricePerGram = pricing.TodayPricePerGram;
        } else {
            throw new Error('Pricing not found for the selected carat');
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Method to calculate the current price based on latest pricing data
goldProductSchema.methods.getCurrentPrice = async function() {
    try {
        // Get the latest pricing data for this carat
        const latestPricing = await Pricing.findOne({ Carat: this.carat }).sort({ createdAt: -1 });
        if (latestPricing) {
            // Gold price calculation
            const originalGoldPrice = this.netWeight * this.pricePerGram;
            const currentGoldPrice = this.netWeight * latestPricing.TodayPricePerGram;
            
            // Making charge calculation (as percentage of gold price)
            const originalMakingChargeAmount = originalGoldPrice * (this.makingCharge / 100);
            const currentMakingChargeAmount = currentGoldPrice * (this.makingCharge / 100);
            
            // Total price calculation
            const originalTotalPrice = originalGoldPrice + originalMakingChargeAmount;
            const currentTotalPrice = currentGoldPrice + currentMakingChargeAmount;
            
            return {
                originalPricePerGram: this.pricePerGram,
                currentPricePerGram: latestPricing.TodayPricePerGram,
                originalGoldPrice,
                currentGoldPrice,
                makingChargePercentage: this.makingCharge,
                originalMakingChargeAmount,
                currentMakingChargeAmount,
                originalTotalPrice,
                currentTotalPrice
            };
        }
        return null;
    } catch (error) {
        console.error('Error calculating current price:', error);
        return null;
    }
};

const GoldProduct = mongoose.model('GoldProduct', goldProductSchema);

module.exports = GoldProduct;