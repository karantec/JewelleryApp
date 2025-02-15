const HomePage = require("../models/HomePage.model");

// **Create or Update Home Page Configuration**
const createOrUpdateHomePage = async (req, res) => {
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

    // Check if a home page config already exists (assuming only one document exists)
    let homePage = await HomePage.findOne();

    if (homePage) {
      // Update existing home page config
      homePage.carousel = carousel;
      homePage.categories = categories;
      homePage.specials = specials;
      homePage.trendingProducts = trendingProducts;
      homePage.bestOffers = bestOffers;
      homePage.editorialImages = editorialImages;
      homePage.customerReviews = customerReviews;
      homePage.everyDayElegance = everyDayElegance;
      homePage.featureProduct = featureProduct;
      homePage.bestSellingProduct = bestSellingProduct;
    } else {
      // Create new home page config
      homePage = new HomePage({
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
    }

    await homePage.save();
    res.status(201).json({ message: "Home page configuration saved successfully", homePage });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

// **Get Home Page Configuration**
const getHomePage = async (req, res) => {
  try {
    const homePage = await HomePage.findOne(); // Fetch the only existing homepage document

    if (!homePage) {
      return res.status(404).json({ message: "Home page configuration not found" });
    }

    res.status(200).json(homePage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
};

module.exports = { createOrUpdateHomePage, getHomePage };
