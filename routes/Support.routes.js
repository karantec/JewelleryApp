const express = require("express");
const {
  createSupport,
  getAllSupport,
} = require("../controller/Support.Controller");
const router = express.Router();

router.post("/", createSupport);
router.get("/", getAllSupport);

module.exports = router;
