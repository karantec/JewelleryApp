const express = require("express");
const router = express.Router();
const {
  createAbout,
  getAllAbout,
  getAboutById,
  updateAbout,
  deleteAbout,
} = require("../controller/About.Controller");

router.post("/", createAbout);
router.get("/", getAllAbout);
router.get("/:id", getAboutById);
router.put("/:id", updateAbout);
router.delete("/:id", deleteAbout);

module.exports = router;
