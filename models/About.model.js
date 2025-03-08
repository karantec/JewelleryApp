// models/pageContent.js
const mongoose = require('mongoose');

// Feature sub-schema
const AboutSchema = new mongoose.Schema({
  
  about: {
    type: String,
    
  },
  title: {
    type: String,
    
  },
  buttonText: {
    type: String,
    default: 'Know More'
  },
  description1: {
    type: String,
    
  },
  featuredImage: {
    type: String, // URL to image
 
  },
  history:{
    type: String,
    
  },
  category: {
    type: String,
    enum: ['CRAFTSMANSHIP', 'QUALITY MATERIALS', 'CUSTOMIZATION', 'SECURE SHOPPING', 'LEARN GUARANTEE'],
   
  },
  establishedYear: {
    type: Number
  },
  founderImage: {
    type: String, // URL to image
    
  },
});

// Main schema combining all sections


module.exports = mongoose.model('About', AboutSchema);