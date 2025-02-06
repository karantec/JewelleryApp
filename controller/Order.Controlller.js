const Order = require('../models/Order.model');
const User = require('../models/User.model');
const GoldProduct = require('../models/GoldProduct.model');
const GoldPriceService = require('../services/goldPriceService');

// Create a new order
const createOrder = async (req, res) => {
    try {
        const { userId, products, totalAmount, shippingAddress } = req.body;

        // Validate if user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let calculatedTotal = 0;

        for (const item of products) {
            const product = await GoldProduct.findById(item.productId);
            if (!product) {
                return res.status(404).json({ 
                    message: `Product not found: ${item.productId}` 
                });
            }

            // Check if product is available
            if (!product.isAvailable) {  // Use isAvailable instead of inStock
                return res.status(400).json({ 
                    message: `Product is not available for order: ${product.name}` 
                });
            }

            // Calculate using discounted price
            const latestPrice = product.discountedPrice;

            // Debugging logs
            console.log(`Product: ${product.name}, Latest Price: ₹${latestPrice}`);

            const cartPrice = item.price;

            const priceDiscrepancy = Math.abs(latestPrice - cartPrice) / cartPrice;
            if (priceDiscrepancy > 0.05) {
                return res.status(400).json({
                    message: `Price has changed significantly for ${product.name}. Please review your cart.`,
                    currentPrice: latestPrice,
                    cartPrice
                });
            }

            calculatedTotal += latestPrice * item.quantity;
        }

        if (Math.abs(calculatedTotal - totalAmount) > 1) {
            return res.status(400).json({
                message: 'Order total does not match product prices',
                calculated: calculatedTotal,
                submitted: totalAmount
            });
        }

        const newOrder = new Order({
            userId,
            products: products.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                priceAtPurchase: item.price,
                karatAtPurchase: item.karat,
                weightAtPurchase: item.weight
            })),
            totalAmount,
            shippingAddress,
            orderDate: new Date(),
            status: 'pending',
            goldPriceAtPurchase: await GoldPriceService.fetchGoldPrice()
        });

        await newOrder.save();

        res.status(201).json({ 
            message: 'Order created successfully', 
            order: newOrder 
        });

    } catch (error) {
        console.error('🔥 Order creation error:', error);
        res.status(500).json({ 
            message: 'Error creating order', 
            error: error.message 
        });
    }
};
// Get all orders with detailed product information
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email phone') // Select specific user fields
            .populate('products.productId', 'name category karat weight images')
            .sort({ orderDate: -1 }); // Most recent first

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching orders', 
            error: error.message 
        });
    }
};

// Get a specific order by ID
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'name email phone')
            .populate('products.productId', 'name category karat weight images');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching order', 
            error: error.message 
        });
    }
};

// Update an order
const updateOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // Only allow status updates

        const updatedOrder = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('userId products.productId');

        if (!updatedOrder) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // If order is cancelled, restore product stock
        if (status === 'cancelled') {
            for (const item of updatedOrder.products) {
                await GoldProduct.findByIdAndUpdate(item.productId, {
                    inStock: true
                });
            }
        }

        res.status(200).json({ 
            message: 'Order updated successfully', 
            order: updatedOrder 
        });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error updating order', 
            error: error.message 
        });
    }
};

// Delete an order (soft delete recommended for orders)
const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Soft delete by updating status
        order.status = 'deleted';
        order.deletedAt = new Date();
        await order.save();

        // Restore product stock
        for (const item of order.products) {
            await GoldProduct.findByIdAndUpdate(item.productId, {
                inStock: true
            });
        }

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ 
            message: 'Error deleting order', 
            error: error.message 
        });
    }
};

// Get orders by user ID
const getOrdersByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const orders = await Order.find({ userId })
            .populate('products.productId', 'name category karat weight images')
            .sort({ orderDate: -1 });

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ 
            message: 'Error fetching user orders', 
            error: error.message 
        });
    }
};

module.exports = {
    createOrder,
    getAllOrders,
    getOrderById,
    updateOrder,
    deleteOrder,
    getOrdersByUser
};