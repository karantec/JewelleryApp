const express = require("express");
const { createOrUpdateHomePage, getHomePage } = require("../controller/Homepage.Controller");

const router = express.Router();

// **Route to create or update home page configuration**
router.post("/create", createOrUpdateHomePage);

// **Route to get home page configuration**
router.get("/get", getHomePage);

module.exports = router;
