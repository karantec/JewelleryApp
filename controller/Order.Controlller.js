const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");
const GoldProduct = require("../models/GoldProduct.model");
const crypto = require("crypto");
const https = require("https");
const dns = require("dns");

// Initialize Cashfree SDK with environment variables
const { Cashfree } = require("cashfree-pg");

// Network diagnostic function
const diagnosticNetworkConnectivity = async () => {
  console.log("🔍 Running network diagnostics...");

  // 1. Check DNS resolution
  try {
    const addresses = await dns.promises.lookup("api.cashfree.com");
    console.log("✅ DNS Resolution successful:", addresses);
  } catch (dnsError) {
    console.error("❌ DNS Resolution failed:", dnsError.message);
    return false;
  }

  // 2. Check basic connectivity
  return new Promise((resolve) => {
    const req = https.request(
      {
        hostname: "api.cashfree.com",
        port: 443,
        path: "/pg/orders",
        method: "GET",
        timeout: 10000,
        headers: {
          "User-Agent": "Node.js-Diagnostic",
        },
      },
      (res) => {
        console.log("✅ HTTPS Connection successful, Status:", res.statusCode);
        resolve(true);
      }
    );

    req.on("error", (error) => {
      console.error("❌ HTTPS Connection failed:", error.message);
      resolve(false);
    });

    req.on("timeout", () => {
      console.error("❌ Connection timeout");
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Alternative Cashfree configuration with custom agent
const setupCashfreeWithCustomAgent = () => {
  try {
    // Configure Cashfree with custom HTTPS agent
    Cashfree.XClientId = process.env.CASHFREE_APP_ID;
    Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;

    // Use sandbox for testing, production for live
    if (process.env.CASHFREE_ENVIRONMENT === "PRODUCTION") {
      Cashfree.XEnvironment = Cashfree.Environment.PRODUCTION;
    } else {
      Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
    }

    console.log("✅ Cashfree SDK configured");
    return true;
  } catch (error) {
    console.error("❌ Cashfree SDK configuration failed:", error.message);
    return false;
  }
};

// Fallback HTTP client for direct API calls
const createCashfreeOrderDirect = async (orderData) => {
  const baseUrl =
    process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
      ? "https://api.cashfree.com"
      : "https://sandbox.cashfree.com";

  const url = `${baseUrl}/pg/orders`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-api-version": "2023-08-01",
    "x-client-id": process.env.CASHFREE_APP_ID,
    "x-client-secret": process.env.CASHFREE_SECRET_KEY,
  };

  console.log("🔄 Making direct API call to:", url);

  try {
    // Using fetch if available (Node 18+) or can use axios/node-fetch
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorData}`);
    }

    const result = await response.json();
    console.log("✅ Direct API call successful");
    return result;
  } catch (fetchError) {
    console.error("❌ Direct API call failed:", fetchError.message);

    // Fallback using https module
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(orderData);

      const options = {
        hostname:
          process.env.CASHFREE_ENVIRONMENT === "PRODUCTION"
            ? "api.cashfree.com"
            : "sandbox.cashfree.com",
        port: 443,
        path: "/pg/orders",
        method: "POST",
        headers: {
          ...headers,
          "Content-Length": Buffer.byteLength(postData),
        },
        timeout: 30000, // 30 seconds timeout
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log("✅ Fallback API call successful");
              resolve(result);
            } else {
              console.error("❌ API returned error:", res.statusCode, result);
              reject(
                new Error(
                  `API Error ${res.statusCode}: ${JSON.stringify(result)}`
                )
              );
            }
          } catch (parseError) {
            console.error("❌ Failed to parse response:", data);
            reject(new Error(`Parse error: ${parseError.message}`));
          }
        });
      });

      req.on("error", (error) => {
        console.error("❌ Fallback request failed:", error.message);
        reject(error);
      });

      req.on("timeout", () => {
        console.error("❌ Fallback request timeout");
        req.destroy();
        reject(new Error("Request timeout"));
      });

      req.write(postData);
      req.end();
    });
  }
};

const createOrder = async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    const { shippingAddress, paymentMethod, cartId } = req.body;

    if (!userId) {
      return res.status(403).json({ message: "User authentication failed" });
    }

    if (!cartId) {
      return res
        .status(400)
        .json({ message: "Cart ID and User ID are required" });
    }

    // Validate Cashfree credentials and environment
    if (paymentMethod === "ONLINE") {
      console.log("=== Cashfree Environment Check ===");
      console.log("CASHFREE_ENVIRONMENT:", process.env.CASHFREE_ENVIRONMENT);
      console.log("CASHFREE_APP_ID:", process.env.CASHFREE_APP_ID);
      console.log(
        "CASHFREE_SECRET_KEY exists:",
        !!process.env.CASHFREE_SECRET_KEY
      );

      if (!process.env.CASHFREE_APP_ID || !process.env.CASHFREE_SECRET_KEY) {
        console.error("Missing Cashfree credentials in environment variables");
        return res.status(500).json({
          message: "Payment service configuration error",
          error: "Missing payment gateway credentials",
        });
      }

      // Run network diagnostics
      const networkOk = await diagnosticNetworkConnectivity();
      if (!networkOk) {
        console.error("⚠️ Network connectivity issues detected");
        return res.status(500).json({
          message: "Network connectivity issue",
          error: "Unable to reach payment gateway servers",
          suggestion:
            "Please check your internet connection or try again later",
        });
      }
    }

    const cart = await Cart.findOne({ _id: cartId }).populate(
      "items.productId"
    );
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;

      if (!product) {
        return res.status(400).json({
          message: `Invalid product: ${item?.productId || "unknown"}`,
        });
      }

      const priceDetails = await product.getCurrentPrice();
      const latestBasePrice = parseFloat(priceDetails.currentTotalPrice);
      if (isNaN(latestBasePrice)) {
        return res
          .status(400)
          .json({ message: "Unable to get latest product price" });
      }

      const priceWithGST = +(latestBasePrice * 1.03).toFixed(2);
      const totalItemPrice = +(priceWithGST * item.quantity).toFixed(2);
      totalAmount += totalItemPrice;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        priceAtTimeOfAdding: priceWithGST,
        productSnapshot: {
          name: product.name,
          description: product.description,
          category: product.category,
          image: product.image,
        },
      });
    }

    const newOrderData = {
      userId,
      cartId: cart._id,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Pending" : "Pending",
      orderStatus: paymentMethod === "COD" ? "ORDER PLACED" : "Created",
      orderDate: new Date(),
    };

    // Cashfree payment method with improved error handling
    if (paymentMethod === "ONLINE") {
      const MAX_CASHFREE_AMOUNT = process.env.CASHFREE_MAX_AMOUNT || 500000;

      console.log(
        `Order amount: ₹${totalAmount}, Max allowed: ₹${MAX_CASHFREE_AMOUNT}`
      );

      if (totalAmount > MAX_CASHFREE_AMOUNT) {
        const suggestedSplits = Math.ceil(totalAmount / MAX_CASHFREE_AMOUNT);
        const suggestedAmountPerOrder = Math.ceil(
          totalAmount / suggestedSplits
        );

        return res.status(400).json({
          message: `Order amount ₹${totalAmount} exceeds your account limit of ₹${MAX_CASHFREE_AMOUNT}.`,
          maxAmount: MAX_CASHFREE_AMOUNT,
          currentAmount: totalAmount,
          suggestions: {
            splitOrder: {
              recommendedSplits: suggestedSplits,
              amountPerOrder: suggestedAmountPerOrder,
              message: `Consider splitting into ${suggestedSplits} orders of approximately ₹${suggestedAmountPerOrder} each`,
            },
            alternativePayment:
              "Consider using bank transfer or other payment methods for high-value transactions",
            accountUpgrade:
              "Contact support to increase your transaction limit",
          },
        });
      }

      // Generate unique order ID for Cashfree
      const cashfreeOrderId = `order_${Date.now()}_${cart._id
        .toString()
        .slice(-6)}`;

      const orderRequest = {
        order_id: cashfreeOrderId,
        order_amount: totalAmount,
        order_currency: "INR",
        order_note: `Order for cart ${cart._id}`,
        customer_details: {
          customer_id: userId.toString(),
          customer_name: shippingAddress?.fullName || "Customer",
          customer_email: req.user?.email || "customer@example.com",
          customer_phone: shippingAddress?.phoneNumber || "9999999999",
        },
        order_meta: {
          return_url: `${
            process.env.FRONTEND_URL || "https://srilaxmialankar.com/"
          }/payment/success?order_id=${cashfreeOrderId}`,
          notify_url: `${
            process.env.BACKEND_URL || "http://localhost:8000"
          }/api/payment/cashfree/webhook`,
        },
        order_tags: {
          cart_id: cart._id.toString(),
          user_id: userId.toString(),
        },
      };

      try {
        console.log("🔄 Creating Cashfree order with ID:", cashfreeOrderId);

        let cashfreeResponse;

        // Try SDK first, then fallback to direct API call
        try {
          if (setupCashfreeWithCustomAgent()) {
            console.log("🔄 Attempting SDK call...");
            cashfreeResponse = await Cashfree.PGCreateOrder(
              "2023-08-01",
              orderRequest
            );
            console.log("✅ SDK call successful");
          } else {
            throw new Error("SDK setup failed");
          }
        } catch (sdkError) {
          console.log("⚠️ SDK call failed, trying direct API call...");
          console.error("SDK Error:", sdkError.message);

          // Fallback to direct API call
          cashfreeResponse = await createCashfreeOrderDirect(orderRequest);
        }

        console.log(
          "Cashfree Order Response:",
          JSON.stringify(cashfreeResponse, null, 2)
        );

        // Check if the response is successful
        if (cashfreeResponse && cashfreeResponse.payment_session_id) {
          newOrderData.cashfree = {
            orderId: cashfreeOrderId,
            cfOrderId:
              cashfreeResponse.cf_order_id || cashfreeResponse.order_id,
            orderDetails: cashfreeResponse,
            paymentSessionId: cashfreeResponse.payment_session_id,
          };
        } else {
          console.error(
            "Unexpected Cashfree response format:",
            cashfreeResponse
          );
          throw new Error(
            "Failed to create Cashfree order - Invalid response format"
          );
        }
      } catch (cashfreeError) {
        console.error("🔥 Cashfree order creation error:", cashfreeError);

        // Enhanced error logging
        if (cashfreeError.code === "ENOTFOUND") {
          console.error("❌ DNS/Network Error - Cannot reach Cashfree servers");
          return res.status(500).json({
            message: "Payment gateway connectivity issue",
            error: "Unable to connect to payment service",
            suggestion: "Please check your internet connection and try again",
            technicalDetails: "DNS resolution failed for api.cashfree.com",
          });
        }

        if (cashfreeError.code === "ECONNREFUSED") {
          console.error("❌ Connection Refused - Cashfree servers unavailable");
          return res.status(500).json({
            message: "Payment gateway temporarily unavailable",
            error: "Payment service connection refused",
            suggestion: "Please try again in a few minutes",
          });
        }

        if (cashfreeError.code === "ETIMEDOUT") {
          console.error("❌ Request Timeout");
          return res.status(500).json({
            message: "Payment gateway timeout",
            error: "Request to payment service timed out",
            suggestion: "Please try again",
          });
        }

        // Handle HTTP errors
        if (cashfreeError.response?.status === 401) {
          return res.status(500).json({
            message: "Payment gateway authentication failed",
            error: "Invalid payment service credentials",
            suggestion: "Please check your Cashfree App ID and Secret Key",
          });
        }

        if (cashfreeError.response?.status === 400) {
          return res.status(400).json({
            message: "Invalid request to payment gateway",
            error:
              cashfreeError.response?.data?.message || cashfreeError.message,
            details: cashfreeError.response?.data || "Bad request format",
          });
        }

        return res.status(500).json({
          message: "Failed to create payment order",
          error: cashfreeError.message,
          details: cashfreeError.response?.data || "No additional details",
        });
      }
    }

    // Create and save the order
    const newOrder = new Order(newOrderData);
    await newOrder.save();

    // Mark products as unavailable
    for (const item of cart.items) {
      await GoldProduct.findByIdAndUpdate(item.productId._id, {
        isAvailable: false,
      });
    }

    // Clear the cart
    await Cart.findByIdAndUpdate(cartId, { $set: { items: [] } });

    // Return success response
    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      cashfreeOrder: newOrder.cashfree?.orderDetails || null,
      paymentSessionId: newOrder.cashfree?.paymentSessionId || null,
    });
  } catch (error) {
    console.error("🔥 Error creating order:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
};
