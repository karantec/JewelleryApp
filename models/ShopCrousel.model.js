const mongoose = require("mongoose");

const ShopSchema = new mongoose.Schema({
  title: { type: String, required: true },
  headline: { type: String, required: true },
  shopTitle: { type: String, required: true },
  subtext: { type: String, required: true },
  buttonText: { type: String, required: true },
  buttonLink: { type: String },
  image: { type: String }, // optional
});

module.exports = mongoose.model("ShopSchema", ShopSchema);
