const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    type: { type: String, enum: ['Home', 'Work', 'Other'], required: true },
    address: { type: String, required: true },
    pinCode: { type: String, required: true }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    profileImage: { type: String, required: true },
    addresses: { type: [addressSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);


