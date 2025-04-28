const mongoose = require("mongoose");

const CrouselSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },

  image: { type: String }, // Add this field to store the image URL or path
});

// Middleware to update the updatedAt field before saving
CrouselSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Crousel", CrouselSchema);
