const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    categoryname : { type: String, required: true },
    Image: { type: String, required: true },
    // Add this field to store the image URL or path
});

// Middleware to update the updatedAt field before saving
CategorySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Category', CategorySchema);
