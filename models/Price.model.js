const mongoose = require('mongoose');

const PriceSchema = new mongoose.Schema({
    
    Carat:{
        type: String,
    
    },

   TodayPricePerGram:{
        type: Number,
    
    },
    createdAt: {
        type: Date,
    default: Date.now
    },
});

// Middleware to update the updatedAt field before saving
const Pricing = mongoose.model("Pricing", PriceSchema);

module.exports = Pricing;