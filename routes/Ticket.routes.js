const express = require("express");
const {
  createTicket,
  getAllTickets,
} = require("../controller/Ticket.Controller");
const router = express.Router();

// Route to create a new ticket (POST)
router.post("/tickets", createTicket);

// Route to get all tickets (GET)
router.get("/tickets", getAllTickets);

module.exports = router;
