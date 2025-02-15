const express = require("express");
const {  createHomePage, getAllHomePages } = require("../controller/Homepage.Controller");

const router = express.Router();

// **Route to create or update home page configuration**
router.post("/create", createHomePage);

// **Route to get home page configuration**
router.get("/get", getAllHomePages);

module.exports = router;
