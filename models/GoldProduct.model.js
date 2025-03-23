const mongoose = require('mongoose');

const goldProductSchema = new mongoose.Schema({
    name: { type: String, required: true},
    category: { type:String, required: true },
    netWeight: { 
        type: Number, 
        required: [true, "Net weight is required"],
        min: [0, "Net weight cannot be negative"] 
    },
    grossWeight: { 
        type: Number, 
        required: [true, "Gross weight is required"],
        min: [0, "Gross weight cannot be negative"] 
    },// Improved naming
    description: { type: String,  },
    coverImage: { type: String,  }, // Cover image URL
    images: [{ type: String,  }], // Cloudinary URLs stored here
}, { timestamps: true }); // Adds `createdAt` and `updatedAt` automatically

const GoldProduct = mongoose.model('GoldProduct', goldProductSchema);

module.exports = GoldProduct;
