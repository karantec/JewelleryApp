const mongoose = require("mongoose");

const GiftingSchema = new mongoose.Schema({
  image: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Gifting", GiftingSchema);
