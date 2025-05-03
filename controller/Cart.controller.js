const Cart = require("../models/Cart.model");
const GoldProduct = require("../models/GoldProduct.model");

// ✅ Add to Cart (store only productId and quantity)
exports.addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    if (!userId || !productId || !quantity) {
      return res
        .status(400)
        .json({ message: "User ID, Product ID, and quantity are required" });
    }

    const product = await GoldProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Get current price of one unit
    const priceDetails = await product.getCurrentPrice();

    if (
      !priceDetails.currentTotalPrice ||
      isNaN(priceDetails.currentTotalPrice)
    ) {
      return res
        .status(400)
        .json({ message: "Could not determine product price", priceDetails });
    }

    const singleUnitPrice = +priceDetails.currentTotalPrice.toFixed(2); // rounded
    // const totalItemPrice = +(singleUnitPrice * quantity).toFixed(2); // include quantity

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      existingItem.quantity += quantity;
      // optionally, update price too if you want per quantity change
      // existingItem.priceAtTimeOfAdding += totalItemPrice;
    } else {
      cart.items.push({
        productId,
        quantity,
        // priceAtTimeOfAdding: totalItemPrice
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart });
  } catch (error) {
    console.error("🔥 Error in addToCart:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Get Cart (with real-time price + GST)
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const updatedItems = [];

    for (const item of cart.items) {
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
      cartId: cart._id,
      userId: cart.userId,
      items: updatedItems,
    });
  } catch (error) {
    console.error("🔥 Error in getCart:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

exports.removeSingleItemFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ message: "User ID and Product ID are required" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ message: "Product not found in cart" });
    }

    const item = cart.items[itemIndex];

    if (item.quantity > 1) {
      item.quantity -= 1;
    } else {
      cart.items.splice(itemIndex, 1); // remove if quantity is 1
    }

    await cart.save();
    res
      .status(200)
      .json({ message: "Product quantity updated or removed", cart });
  } catch (error) {
    console.error("🔥 Error in removeSingleItemFromCart:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// ✅ Remove from Cart
exports.removeFromCart = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (item) => item.productId.toString() !== productId
    );
    await cart.save();

    res.status(200).json({ message: "Item removed from cart", cart });
  } catch (error) {
    console.error("🔥 Error in removeFromCart:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};
