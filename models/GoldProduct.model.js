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
    },
    carat: {
        type: String,
        enum: ['24K', '22K', '18K'], // Restricts values to these options
        required: [true, "Carat value is required"]
    },
    goldPrice: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoldPrice'  // This should match the model name you used in mongoose.model()
      },
    makingcharge: { 
        type: Number, 
        required: [true, "Making charge is required"],
        min: [0, "Making charge cannot be negative"] 
    },

    
    description: { type: String,  },
    coverImage: { type: String,  }, // Cover image URL
    images: [{ type: String,  }], // Cloudinary URLs stored here
}, { timestamps: true }); // Adds `createdAt` and `updatedAt` automatically

const GoldProduct = mongoose.model('GoldProduct', goldProductSchema);

module.exports = GoldProduct;
