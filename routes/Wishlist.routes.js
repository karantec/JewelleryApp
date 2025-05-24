const express = require("express");
const {
  getWishlist,
  addToWishList,
} = require("../controller/Wishlist.Controller");

const router = express.Router();

router.get("/wishlist/:userId", getWishlist);

router.post("/wishlist", addToWishList);

module.exports = router;
