require('dotenv').config();
const GoldPriceService = require('./services/goldPriceService');

// Start the scheduler
GoldPriceService.startPriceUpdateScheduler();

// Run initial update
GoldPriceService.updateProductPrices()
    .then(() => console.log('Initial price update completed'))
    .catch(err => console.error('Initial price update failed:', err));