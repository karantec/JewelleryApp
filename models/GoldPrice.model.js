const mongoose = require('mongoose');

const GoldPriceSchema = new mongoose.Schema({

   TodayGoldPricePerGram:{
        type: Number,
        required: [true, "Today's gold price per gram is required"],
        min: [0, "Price cannot be negative"]
    },
});

// Middleware to update the updatedAt field before saving
const GoldPrice = mongoose.model("GoldPrice", GoldPriceSchema);

module.exports = GoldPrice;