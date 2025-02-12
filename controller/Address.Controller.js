const User = require('../models/User.model'); // Adjust the path based on your project structure

// Create a new address
exports.addAddress = async (req, res) => {
    try {
        console.log("Request Body:", req.body); // ✅ Check the received data

        const userId = req.params.userId;
        const { type, addressLine, city, state, zipcode, country, landmark, primaryPhone, secondaryPhone, isDefault } = req.body;

        // ✅ Validate required fields BEFORE saving
        if (!type || !addressLine || !city || !state || !zipcode || !country || !primaryPhone) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Ensure only one address is marked as default
        if (isDefault) {
            user.addresses.forEach(addr => (addr.isDefault = false));
        }

        user.addresses.push({ type, addressLine, city, state, zipcode, country, landmark, primaryPhone, secondaryPhone, isDefault });
        await user.save();

        res.status(201).json({ message: 'Address added successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update an existing address
exports.updateAddress = async (req, res) => {
    try {
        const { userId, addressId } = req.params;
        const updateFields = req.body; // Only update provided fields

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const addressIndex = user.addresses.findIndex(addr => addr._id.toString() === addressId);
        if (addressIndex === -1) {
            return res.status(404).json({ message: 'Address not found' });
        }

        // ✅ If setting a new default address, unset previous default
        if (updateFields.isDefault) {
            user.addresses.forEach(addr => (addr.isDefault = false));
        }

        // ✅ Use `$set` to update only provided fields
        Object.keys(updateFields).forEach(key => {
            user.addresses[addressIndex][key] = updateFields[key];
        });

        await user.save();
        res.json({ message: 'Address updated successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get all addresses for a user
exports.getAddresses = async (req, res) => {
    try {
        const { userId } = req.params;
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
        const { userId, addressId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // ✅ Remove the address by filtering it out
        user.addresses = user.addresses.filter(addr => addr._id.toString() !== addressId);
        await user.save();

        res.json({ message: 'Address deleted successfully', addresses: user.addresses });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
