const mongoose = require('mongoose');

const JewellerysCategorySchema = new mongoose.Schema({
    title: { type: String, unique: true, required: true }, // Change name to category
    image: { type: String, required: true },
});

// Middleware to update the updatedAt field before saving
const JewelleryCategory = mongoose.model("Category", JewellerysCategorySchema);

module.exports = JewelleryCategory;