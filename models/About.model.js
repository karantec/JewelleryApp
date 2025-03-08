// models/pageContent.js
const mongoose = require('mongoose');

// Feature sub-schema
const AboutSchema = new mongoose.Schema({
  icon: {
    type: String, // Icon identifier or URL
    required: true
  },
  about: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  buttonText: {
    type: String,
    default: 'Know More'
  },
  description1: {
    type: String,
    required: true
  },
  featuredImage: {
    type: String, // URL to image
    required: true
  },
  history:{
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['CRAFTSMANSHIP', 'QUALITY MATERIALS', 'CUSTOMIZATION', 'SECURE SHOPPING', 'LEARN GUARANTEE'],
    required: true
  },
  establishedYear: {
    type: Number
  },
  founderImage: {
    type: String, // URL to image
    required: true
  },
});

// Main schema combining all sections


module.exports = mongoose.model('About', AboutSchema);