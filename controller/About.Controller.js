const About = require('../models/About.model');

const createAbout = async (req, res) => {
    try {
        const { icon, about, title, buttonText, description1, featuredImage, history, category, establishedYear, founderImage } = req.body;

        const newAbout = new About({
            icon,
            about,
            title,
            buttonText,
            description1,
            featuredImage,
            history,
            category,
            establishedYear,
            founderImage
        });

        await newAbout.save();
        res.status(201).json({
            message: "About created successfully",
            about: newAbout
        });

    } catch (error) {
        console.error("Error in createAbout:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

const getAllAbout = async (req, res) => {
    try {
        const abouts = await About.find();

        if (!abouts.length) {
            return res.status(404).json({
                message: "No About found"
            });
        }
        res.status(200).json({
            message: "Abouts fetched successfully",
            abouts
        });

    } catch (error) {
        console.error("Error in getAllAbout:", error);
        res.status(500).json({
            message: "Server error",
            error: error.message
        });
    }
};

module.exports = {
    createAbout,
    getAllAbout
};
