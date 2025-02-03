const mongoose = require('mongoose');

// Schema for customer reviews
const customerReviewSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  text: { type: String, required: true },
  customerImage: { type: String, required: true },
});

// Schema for specials
const specialSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  productId: { type: String, required: true },
  image: { type: String, required: true },
});

// Schema for categories
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
});

// Main schema for home page configuration
const homePageSchema = new mongoose.Schema({
  carousel: {
    text: { type: String, required: true },
    images: [String],
  },
  categories: [categorySchema],
  specials: [specialSchema],
  trendingProducts: [String],
  bestOffers: [String],
  editorialImages: [String],
  customerReviews: [customerReviewSchema],
});

// Create the model from the schema
const HomePage = mongoose.model('HomePage', homePageSchema);

module.exports = HomePage;
