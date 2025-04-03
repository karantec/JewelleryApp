const Cart = require('../models/Cart.model');
const GoldProduct = require('../models/GoldProduct.model');

// Add item to cart with 3% GST
exports.addToCart = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId || !quantity) {
            return res.status(400).json({ message: "User ID, Product ID, and quantity are required" });
        }

        // Find the product
        const product = await GoldProduct.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Fetch the latest price
        const latestPriceData = await product.getCurrentPrice();

        console.log("🔍 Latest Price Data:", latestPriceData);

        if (!latestPriceData || typeof latestPriceData.currentTotalPrice !== 'number') {
            return res.status(500).json({ 
                message: "Invalid base price retrieved", 
                debugInfo: latestPriceData 
            });
        }

        // Convert to number
        const basePrice = Number(latestPriceData.currentTotalPrice)* quantity;

        if (isNaN(basePrice)) {
            return res.status(500).json({ 
                message: "Base price is NaN", 
                debugInfo: latestPriceData 
            });
        }

        // Calculate 3% GST
        
        const gstAmount = basePrice * 0.03;
        const priceAtTimeOfAdding = basePrice + gstAmount;

        console.log(`✅ Base Price: ${basePrice}, GST: ${gstAmount}, Final Price: ${priceAtTimeOfAdding}`);

        if (isNaN(priceAtTimeOfAdding)) {
            return res.status(500).json({ message: "Price calculation resulted in NaN" });
        }

        // Find or create the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Check if the item already exists in the cart
        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, priceAtTimeOfAdding });
        }

        await cart.save();
        res.status(200).json({ message: "Item added to cart with GST", cart });
    } catch (error) {
        console.error("🔥 Error in addToCart:", error);
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
// Get Cart Items
exports.getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }
        res.status(200).json(cart);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

// Remove Item from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;

        let cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);
        await cart.save();

        res.status(200).json({ message: "Item removed from cart", cart });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
