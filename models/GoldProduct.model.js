const mongoose = require("mongoose");
const Pricing = require("../models/Price.model");

const goldProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    netWeight: {
      type: Number,
      required: [true, "Net weight is required"],
      min: [0, "Net weight cannot be negative"],
    },
    grossWeight: {
      type: Number,
      required: [true, "Gross weight is required"],
      min: [0, "Gross weight cannot be negative"],
    },
    carat: {
      type: String,
      enum: ["24K", "22K", "18K", "Silver"],
      required: [true, "Carat value is required"],
    },
    // Add reference to the pricing model
    pricingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Pricing",
    },
    // Store the price per gram at the time of creation
    pricePerGram: {
      type: Number,
    },
    makingcharge: {
      type: Number, // Changed to Number to store percentage value
      required: [true, "Making charge percentage is required"],
      min: [0, "Making charge percentage cannot be negative"],
    },
    description: { type: String },
    coverImage: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

// Middleware to fetch price per gram based on carat before saving
goldProductSchema.pre("save", async function (next) {
  try {
    // Find the latest pricing document matching this carat
    const pricing = await Pricing.findOne({ Carat: this.carat }).sort({
      createdAt: -1,
    });

    if (pricing) {
      // Store both the reference to the pricing document and the price value
      this.pricingId = pricing._id;
      this.pricePerGram = pricing.TodayPricePerGram;
    } else {
      throw new Error("Pricing not found for the selected carat");
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to calculate the current price based on latest pricing data
goldProductSchema.methods.getCurrentPrice = async function () {
  const latestPrice = await Pricing.findOne({ Carat: this.carat }).sort({
    createdAt: -1,
  });

  if (!latestPrice) {
    return {
      message: "No price data found",
      debugInfo: { error: "Price data not found" },
    };
  }

  // Use TodayPricePerGram instead of pricePerGram
  const pricePerGram = Number(latestPrice.TodayPricePerGram);

  if (isNaN(pricePerGram)) {
    return {
      message: "Base price is NaN",
      debugInfo: { error: "Invalid price data", latestPrice },
    };
  }

  const netWeight = Number(this.netWeight) || 0;
  const makingCharge = Number(this.makingcharge) || 0;

  if (netWeight === 0) {
    return {
      message: "Net weight is missing or invalid",
      debugInfo: { netWeight },
    };
  }

  const goldPrice = netWeight * pricePerGram;
  const makingChargeAmount = (goldPrice * makingCharge) / 100;
  const totalPrice = goldPrice + makingChargeAmount;

  return {
    originalGoldPrice: goldPrice,
    currentGoldPrice: goldPrice,
    originalMakingChargeAmount: makingChargeAmount,
    currentMakingChargeAmount: makingChargeAmount,
    originalTotalPrice: totalPrice,
    currentTotalPrice: totalPrice,
  };
};
const GoldProduct = mongoose.model("GoldProduct", goldProductSchema);

module.exports = GoldProduct;
