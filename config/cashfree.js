const { Cashfree } = require("cashfree-pg");

// Initialize Cashfree with your credentials
Cashfree.XClientId = process.env.CASHFREE_APP_ID;
Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
Cashfree.XEnvironment =
  process.env.CASHFREE_ENVIRONMENT === "PROD"
    ? Cashfree.Environment.PRODUCTION
    : Cashfree.Environment.SANDBOX;

// Export configured Cashfree instance
module.exports = {
  cashfree: Cashfree,
};
