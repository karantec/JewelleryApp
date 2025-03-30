const GoldPrice = require('../models/GoldPrice.model');

// Add Today's Gold Price
const addTodayPrice = async (req, res) => {
    try {
        const { TodayGoldPricePerGram } = req.body;
        
        if (!TodayGoldPricePerGram) {
            return res.status(400).json({ message: 'Gold price is required' });
        }

        const newPrice = new GoldPrice({
            TodayGoldPricePerGram
        });
        await newPrice.save();

        return res.status(201).json({ message: 'Gold price added successfully', data: newPrice });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update Today's Gold Price
const updateTodayPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { TodayGoldPricePerGram } = req.body;

        if (!TodayGoldPricePerGram) {
            return res.status(400).json({ message: 'Gold price is required' });
        }

        const updatedPrice = await GoldPrice.findByIdAndUpdate(id, { TodayGoldPricePerGram }, { new: true });
        
        if (!updatedPrice) {
            return res.status(404).json({ message: 'Gold price not found' });
        }

        return res.status(200).json({ message: 'Gold price updated successfully', data: updatedPrice });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const getTodayPrice = async (req, res) => {
    try {
        const todayPrice = await GoldPrice.findOne().sort({ createdAt: -1 });
        
        if (!todayPrice) {
            return res.status(404).json({ message: 'Gold price not found' });
        }

        return res.status(200).json({ data: todayPrice });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};



module.exports = { addTodayPrice, updateTodayPrice ,getTodayPrice};