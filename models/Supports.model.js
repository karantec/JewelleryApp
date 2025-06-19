// models/Ticket.js

const mongoose = require("mongoose");

const ticketSchema = new mongoose.Schema({
  typeOfSupport: {
    type: String,
    enum: ["technical", "billing", "general"],
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  contactDetails: {
    type: String,
    required: true,
  },
  screenshotUrl: {
    type: String, // store image URL or path
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
