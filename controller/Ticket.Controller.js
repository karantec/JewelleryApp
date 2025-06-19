const { cloudinary } = require("../config/cloudinary");
const Ticket = require("../models/Supports.model");
// POST: Create a new support ticket
const createTicket = async (req, res) => {
  try {
    const { typeOfSupport, subject, description, contactDetails, screenshot } =
      req.body;

    const newTicket = new Ticket({
      typeOfSupport,
      subject,
      description,
      contactDetails,
      screenshot,
    });

    await newTicket.save();
    res
      .status(201)
      .json({ message: "Ticket created successfully", ticket: newTicket });
  } catch (error) {
    console.error("Error in createTicket:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET: Fetch all support tickets
const getAllTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find().sort({ createdAt: -1 });

    if (!tickets.length) {
      return res.status(404).json({ message: "No tickets found" });
    }

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error in getAllTickets:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  createTicket,
  getAllTickets,
};
