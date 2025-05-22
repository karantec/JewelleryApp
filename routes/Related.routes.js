const express = require("express");
const {
  createRelated,
  getRelated,
  getRelatedById,
  updateRelated,
  deleteRelated,
} = require("../controller/Related.Controller");

const router = express.Router();

// POST - Create a new item
router.post("/", createRelated);

// GET - Get all items
router.get("/", getRelated);

// GET - Get item by ID
router.get("/:id", getRelatedById);

// PUT - Update item by ID
router.put("/:id", updateRelated);

// DELETE - Delete item by ID
router.delete("/:id", deleteRelated);

module.exports = router;
