const mongoose = require("mongoose");

const SupportSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    contactEmail: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    supportQuery: {
      type: String,
      required: [true, "Support message is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Support", SupportSchema);
