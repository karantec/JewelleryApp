const express = require("express");
const {
  createEveryday,
  getAllEveryday,
  getEverydayById,
  updateEveryday,
  deleteEveryday,
} = require("../controller/EveryDay.Controller");
const router = express.Router();

// POST - Create a new item
router.post("/", createEveryday);

// GET - Get all items
router.get("/", getAllEveryday);

// GET - Get item by ID
router.get("/:id", getEverydayById);

// PUT - Update item by ID
router.put("/:id", updateEveryday);

// DELETE - Delete item by ID
router.delete("/:id", deleteEveryday);

module.exports = router;
