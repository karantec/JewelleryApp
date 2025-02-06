const User = require('../models/User.model'); // Adjust the path based on your project structure

// Create a new address
exports.addAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { type, address, pinCode } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses.push({ type, address, pinCode });
        await user.save();
        
        res.status(201).json({ message: 'Address added successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { addressId } = req.params;
        const { type, address, pinCode } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        user.addresses[addressIndex] = { type, address, pinCode };
        await user.save();

        res.json({ message: 'Address updated successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all addresses for a user
exports.getAddresses = async (req, res) => {
    try {
        const userId = req.params.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete an address
exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.params.userId;
        const { addressId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();

        res.json({ message: 'Address deleted successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
