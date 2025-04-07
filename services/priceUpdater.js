const GoldProduct = require('../models/GoldProduct.model');
const Pricing = require('../models/Price.model');

const updateProductPrices = async () => {
    try {
        console.log("🔁 Running price update job...");

        const carats = ['24K', '22K', '18K', '1K'];

        for (const carat of carats) {
            const latestPricing = await Pricing.findOne({ Carat: carat }).sort({ createdAt: -1 });

            if (!latestPricing) {
                console.warn(`⚠️ No pricing found for carat ${carat}`);
                continue;
            }

            const { TodayPricePerGram } = latestPricing;

            const updated = await GoldProduct.updateMany(
                { carat },
                {
                    $set: {
                        pricePerGram: TodayPricePerGram,
                        pricingId: latestPricing._id
                    }
                }
            );

            console.log(`✅ Updated ${updated.modifiedCount} product(s) for carat ${carat}`);
        }

    } catch (err) {
        console.error("❌ Error updating product prices:", err.message);
    }
};

// Run every 5 minutes
setInterval(updateProductPrices, 5 * 60 * 1000); // 5 minutes
module.exports = updateProductPrices;