const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    type: { type: String, enum: ['Home', 'Work', 'Other'], required: true },
    addressLine: { type: String, required: [true, "Address Line is required"] },
    city: { type: String, required: [true, "City is required"] },
    state: { type: String, required: [true, "State is required"] },
    zipcode: { type: String, required: [true, "Zipcode is required"] },
    country: { type: String, required: [true, "Country is required"] },
    landmark: { type: String },
    primaryPhone: { type: String, required: [true, "Primary Phone is required"] },
    secondaryPhone: { type: String },
    isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, },
    profileImage: { type: String,  },
    addresses: { type: [addressSchema], default: [] },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
