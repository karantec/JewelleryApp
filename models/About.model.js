// models/pageContent.js
const mongoose = require("mongoose");

// Feature sub-schema
const AboutSchemaUp = new mongoose.Schema({
  title: {
    type: String,
  },
  subtitle: {
    type: String,
  },
  description1: {
    type: String,
  },
  description2: {
    type: String,
  },
  description3: {
    type: String,
  },
  Image1: {
    type: String, // URL to image
  },
  Image2: {
    type: String, // URL to image
  },
  Image3: {
    type: String, // URL to image
  },
});

// Main schema combining all sections

module.exports = mongoose.model("About", AboutSchemaUp);
