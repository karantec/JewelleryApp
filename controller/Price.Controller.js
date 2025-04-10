const Pricing = require('../models/Price.model');

// Add Today's Gold Price
const addTodayPrice = async (req, res) => {
    try {

        const {Carat, TodayPricePerGram } = req.body;
        
       

        // Check if the required field is provided
      
        const TodayPricePer=Number(TodayPricePerGram);
        const  carat=await  Pricing.findOne({ Carat });
        if (carat) {
            return res.status(400).json({ message: "Carat already exists" });
        }
        // Create a new price entry
        const newPrice = new Pricing({
            Carat,
            TodayPricePerGram: TodayPricePer,
        });

        // Save the new price
        await newPrice.save();

        return res.status(201).json({ message: "Gold price added successfully", Price: newPrice });
    } catch (error) {
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update Today's Gold Price
const updateTodayPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { Carat, TodayPricePerGram } = req.body;
        
        const TodayPricePer=Number(TodayPricePerGram);
        // Use Pricing instead of GoldPrice
        const updatedPrice = await Pricing.findByIdAndUpdate(
            id, 
            { Carat, TodayPricePerGram: TodayPricePer }, 
            { new: true }
        );
        
        if (!updatedPrice) {
            return res.status(404).json({ message: 'Gold price not found' });
        }
        
        return res.status(200).json({ message: 'Gold price updated successfully', data: updatedPrice });
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};


const getAllPrice = async (req, res) => {
  try {
    const blogs = await Pricing.find().limit(10);;
    console.log("Fetched Blogs:", blogs);  
    if (!blogs.length) {
      return res.status(404).json({ message: "No blog posts found" });
    }

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


module.exports = { addTodayPrice,  updateTodayPrice , getAllPrice};