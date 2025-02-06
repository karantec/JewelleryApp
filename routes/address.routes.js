const express = require('express');
const { addAddress, updateAddress, getAddresses, deleteAddress } = require('../controller/Address.Controller');
const router = express.Router();

// Define routes for address management
router.post('/:userId/addresses', addAddress); // Add address
router.put('/:userId/addresses/:addressId',updateAddress); // Update address
router.get('/:userId/addresses', getAddresses); // Get all addresses
router.delete('/:userId/addresses/:addressId',deleteAddress); // Delete address

module.exports = router;
