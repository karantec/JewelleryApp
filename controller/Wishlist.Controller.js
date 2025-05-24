const GoldProduct = require("../models/GoldProduct.model");
const Wishlist = require("../models/Wishlist.model");

const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ userId }).populate(
      "items.productId"
    );

    if (!wishlist)
      return res.status(404).json({ message: "Wishlist not found" });

    const updatedItems = [];

    for (const item of wishlist.items) {
      const product = item.productId;

      // ✅ Null check before accessing methods on product
      if (!product || typeof product.getCurrentPrice !== "function") {
        console.warn(
          `⚠️ Skipping item with invalid productId: ${item.productId}`
        );
        continue; // Skip this item if product is null or doesn't have the method
      }

      const latestPrice = await product.getCurrentPrice();
      const basePrice = Number(latestPrice.currentTotalPrice) * item.quantity;

      updatedItems.push({
        product,
        quantity: item.quantity,
        realTimeTotalPrice: basePrice.toFixed(2),
      });
    }
    res.status(200).json({
      wishlistId: wishlist._id,
      userId: wishlist.userId,
      items: updatedItems,
    });
  } catch (error) {
    console.error("🔥 Error in getWishlist:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const addToWishList = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "User Id, Product ID are required" });
    }

    const product = await GoldProduct.findById(productId);

    // console.log(
    //   "product from gold product " + JSON.stringify(product, null, 2)
    // );

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    const priceDetails = await product?.getCurrentPrice();

    if (
      !priceDetails?.currentTotalPrice ||
      isNaN(priceDetails.currentTotalPrice)
    ) {
      return res
        .status(400)
        .json({ message: "Could not determine product price", priceDetails });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, items: [{ productId, quantity: 1 }] });
    } else {
      wishlist?.items?.push({ productId, quantity: 1 });
    }

    console.log("wishlist " + JSON.stringify(wishlist, null, 2));

    await wishlist.save();
    res.status(200).json({ message: "Item added to wishlist", wishlist });
  } catch (error) {
    console.error("🔥 Error in addToCart:", error);
    res
      .status(500)
      .json({ message: "Internal Server error", error: error?.message });
  }
};

module.exports = { getWishlist, addToWishList };
