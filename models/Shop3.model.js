const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  modelNumber: {
    type: String,
    required: true,
    unique: true,
    default: "#8786867",
  },
  description: {
    type: String,
    required: true,
  },
  style: {
    type: String,
  },
  certificate: {
    type: String,
  },
  goldPurity: {
    type: String,
  }, // ✅ Fixed missing closing brace and comma
  totalWeight: {
    type: String,
  },
  setIncludes: {
    type: [String],
  },
  occasion: {
    type: [String],
  },
  designTheme: {
    type: [String],
  },
  finish: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Product", productSchema);
