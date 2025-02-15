const HomePage = require("../models/HomePage.model");

// **Create New Home Page Configuration**
const createHomePage = async (req, res) => {
  try {
    const {
      carousel,
      categories,
      specials,
      trendingProducts,
      bestOffers,
      editorialImages,
      customerReviews,
      everyDayElegance,
      featureProduct,
      bestSellingProduct,
    } = req.body;

    // Create a new home page configuration
    const newHomePage = new HomePage({
      carousel,
      categories,
      specials,
      trendingProducts,
      bestOffers,
      editorialImages,
      customerReviews,
      everyDayElegance,
      featureProduct,
      bestSellingProduct,
    });

    await newHomePage.save();
    res.status(201).json({ message: "New home page configuration created", newHomePage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Get All Home Page Configurations**
const getAllHomePages = async (req, res) => {
  try {
    const homePages = await HomePage.find(); // Fetch all homepage configurations

    if (!homePages.length) {
      return res.status(404).json({ message: "No home page configurations found" });
    }

    res.status(200).json(homePages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createHomePage, getAllHomePages };
