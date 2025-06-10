const mongoose = require("mongoose");

const AppBannerSchema = new mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt fields automatically
  }
);

const AppBanner = mongoose.model("Scheme", AppBannerSchema);

module.exports = AppBanner;
