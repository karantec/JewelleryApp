const mongoose = require("mongoose");

const InstagramSchema = new mongoose.Schema({
  image: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Instagram", InstagramSchema);
