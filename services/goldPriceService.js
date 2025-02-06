const axios = require('axios');
const cron = require('node-cron');
const GoldProduct = require('../models/GoldProduct.model');

class GoldPriceService {
    constructor() {
        this.lastFetchedPrice = null;
    }

    async fetchGoldPrice() {
        try {
            const response = await axios.get(`https://www.goldapi.io/api/XAU/INR`, {
                headers: {
                    'x-access-token': process.env.GOLD_API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            // Convert price from per ounce to per gram
            const pricePerOunce = response.data.price;
            const pricePerGram = pricePerOunce / 31.1035;
            this.lastFetchedPrice = pricePerGram;
            
            return pricePerGram;
        } catch (error) {
            console.error('Error fetching gold price:', error);
            throw error;
        }
    }

    calculatePriceByKarat(basePrice, karat) {
        const purityRatio = {
            '24K': 1,
            '22K': 0.916,
            '18K': 0.750,
            '14K': 0.585
        };

        return basePrice * purityRatio[karat];
    }

    async updateProductPrices() {
        try {
            const currentGoldPrice = await this.fetchGoldPrice();
            console.log(`Current gold price per gram (24K): ₹${currentGoldPrice.toFixed(2)}`);

            const products = await GoldProduct.find();

            for (const product of products) {
                const pricePerGramForKarat = this.calculatePriceByKarat(currentGoldPrice, product.karat);
                const basePrice = pricePerGramForKarat * product.weight;

                // Add making charges (10% of base price)
                const makingCharges = basePrice * 0.10;
                const finalPrice = basePrice + makingCharges;

                // Apply 5% discount for discounted price
                const discountedPrice = finalPrice * 0.95;

                await GoldProduct.findByIdAndUpdate(product._id, {
                    price: Math.round(finalPrice),
                    discountedPrice: Math.round(discountedPrice)
                });

                console.log(`Updated price for ${product.name}: ₹${Math.round(finalPrice)}`);
            }

            console.log('All product prices updated successfully');
        } catch (error) {
            console.error('Error updating product prices:', error);
            throw error;
        }
    }

    startPriceUpdateScheduler() {
        // Run every hour
        cron.schedule('0 * * * *', async () => {
            console.log('Running scheduled price update...');
            try {
                await this.updateProductPrices();
            } catch (error) {
                console.error('Scheduled price update failed:', error);
            }
        });

        console.log('Price update scheduler started');
    }
}

module.exports = new GoldPriceService();