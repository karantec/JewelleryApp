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

    console.log("Shipping address: ", shippingAddress);

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
          image: product.coverImage,
        },
      });
    }

    const newOrderData = {
      userId,
      cartId: cart._id,
      items: orderItems,
      totalAmount,
      shippingAddress: {
        fullName: shippingAddress.fullName || "Customer",
        addressLine1: shippingAddress.addressLine,
        city: shippingAddress.city,
        state: shippingAddress.state,
        country: shippingAddress.country,
        postalCode: shippingAddress.zipcode,
        phone: shippingAddress.primaryPhone,
      },
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
      }
       catch (cashfreeError) {
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
    return res.status(201).json({
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
const getOrderStatusDirect = async (orderId) => {
  try {
    console.log(
      "🔄 Making direct API call to Cashfree SANDBOX for order:",
      orderId
    );

    // USE SANDBOX URL FOR TESTING
    const response = await fetch(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2023-08-01",
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cashfree API error: ${response.status} - ${errorText}`);
    }

    const orderStatus = await response.json();
    console.log("✅ Direct API call successful");

    return orderStatus;
  } catch (error) {
    console.error("🔥 Direct API call failed:", error.message);
    throw new Error(`Failed to fetch order status: ${error.message}`);
  }
};
const verifyOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const { _id: userId } = req.user || {};

    if (!userId) {
      return res.status(403).json({ message: "User authentication failed" });
    }

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" });
    }

    console.log("🔍 Verifying order:", orderId);

    // Find the order in database
    const order = await Order.findOne({
      $or: [{ "cashfree.orderId": orderId }, { "cashfree.cfOrderId": orderId }],
      userId: userId,
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
        orderId: orderId,
      });
    }

    // If it's a COD order, no payment verification needed
    if (order.paymentMethod === "COD") {
      return res.status(200).json({
        message: "COD order verified successfully",
        order: order,
        paymentStatus: "COD",
        orderStatus: order.orderStatus,
      });
    }

    // For online payments, verify with Cashfree
    if (order.paymentMethod === "ONLINE" && order.cashfree) {
      const cashfreeOrderId = order.cashfree.orderId;

      try {
        console.log("🔄 Fetching order status from Cashfree:", cashfreeOrderId);

        let orderStatus;

        // Try SDK first, then fallback to direct API call
        try {
          if (setupCashfreeWithCustomAgent()) {
            console.log("🔄 Attempting SDK status check...");
            orderStatus = await Cashfree.PGOrderFetchOrder(
              "2023-08-01",
              cashfreeOrderId
            );
            console.log("✅ SDK status check successful");
          } else {
            throw new Error("SDK setup failed");
          }
        } catch (sdkError) {
          console.log("⚠️ SDK status check failed, trying direct API call...");
          console.error("SDK Error:", sdkError.message);

          // Fallback to direct API call
          orderStatus = await getOrderStatusDirect(cashfreeOrderId);
        }

        console.log(
          "Cashfree Order Status:",
          JSON.stringify(orderStatus, null, 2)
        );

        // Update order based on Cashfree response
        let updatedOrder = order;

        if (orderStatus.order_status === "PAID") {
          updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              paymentStatus: "Paid",
              orderStatus: "ORDER PLACED",
              "cashfree.paymentDetails": orderStatus,
              paymentCompletedAt: new Date(),
            },
            { new: true }
          );

          console.log("✅ Payment verified and order updated");

          return res.status(200).json({
            message: "Payment verified successfully",
            order: updatedOrder,
            paymentStatus: "Paid",
            orderStatus: "ORDER PLACED",
            cashfreeStatus: orderStatus,
          });
        } else if (orderStatus.order_status === "ACTIVE") {
          return res.status(200).json({
            message: "Order is active, payment pending",
            order: order,
            paymentStatus: "Pending",
            orderStatus: "Created",
            cashfreeStatus: orderStatus,
          });
        } else if (orderStatus.order_status === "CANCELLED") {
          updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              paymentStatus: "Cancelled",
              orderStatus: "CANCELLED",
              "cashfree.paymentDetails": orderStatus,
            },
            { new: true }
          );

          // Make products available again
          for (const item of order.items) {
            await GoldProduct.findByIdAndUpdate(item.productId._id, {
              isAvailable: true,
            });
          }

          return res.status(200).json({
            message: "Order cancelled",
            order: updatedOrder,
            paymentStatus: "Cancelled",
            orderStatus: "CANCELLED",
            cashfreeStatus: orderStatus,
          });
        } else if (orderStatus.order_status === "EXPIRED") {
          updatedOrder = await Order.findByIdAndUpdate(
            order._id,
            {
              paymentStatus: "Expired",
              orderStatus: "EXPIRED",
              "cashfree.paymentDetails": orderStatus,
            },
            { new: true }
          );

          // Make products available again
          for (const item of order.items) {
            await GoldProduct.findByIdAndUpdate(item.productId._id, {
              isAvailable: true,
            });
          }

          return res.status(200).json({
            message: "Order expired",
            order: updatedOrder,
            paymentStatus: "Expired",
            orderStatus: "EXPIRED",
            cashfreeStatus: orderStatus,
          });
        } else {
          return res.status(200).json({
            message: "Order status retrieved",
            order: order,
            paymentStatus: order.paymentStatus,
            orderStatus: order.orderStatus,
            cashfreeStatus: orderStatus,
          });
        }
      } catch (verifyError) {
        console.error("🔥 Error verifying payment:", verifyError);

        return res.status(500).json({
          message: "Failed to verify payment",
          error: verifyError.message,
          order: order,
        });
      }
    }

    // If we reach here, something went wrong
    return res.status(400).json({
      message: "Unable to verify order",
      order: order,
    });
  } catch (error) {
    console.error("🔥 Error in verifyOrder:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getUserOrders = async (req, res) => {
  try {
    const { _id: userId } = req.user || {};
    const { page = 1, limit = 10, status } = req.query;

    if (!userId) {
      return res.status(403).json({ message: "User authentication failed" });
    }

    const query = { userId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await Order.find(query)
      .populate("items.productId")
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalOrders = await Order.countDocuments(query);

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("🔥 Error getting user orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Single Order
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { _id: userId } = req.user || {};

    if (!userId) {
      return res.status(403).json({ message: "User authentication failed" });
    }

    const order = await Order.findOne({
      _id: orderId,
      userId: userId,
    }).populate("items.productId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order retrieved successfully",
      order,
    });
  } catch (error) {
    console.error("🔥 Error getting order by ID:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentMethod,
      paymentStatus,
      startDate,
      endDate,
      search,
    } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.orderStatus = status;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.orderDate.$lte = new Date(endDate);
      }
    }

    if (search) {
      query.$or = [
        { "shippingAddress.fullName": { $regex: search, $options: "i" } },
        { "shippingAddress.phoneNumber": { $regex: search, $options: "i" } },
        { "cashfree.orderId": { $regex: search, $options: "i" } },
      ];
    }

    const orders = await Order.find(query)
      .populate("userId", "name email phoneNumber")
      .populate("items.productId")
      .sort({ orderDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const totalOrders = await Order.countDocuments(query);

    // Calculate summary statistics
    const totalRevenue = await Order.aggregate([
      { $match: { ...query, paymentStatus: "Paid" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const statusCounts = await Order.aggregate([
      { $match: query },
      { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
    ]);

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders,
      pagination: {
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
      summary: {
        totalRevenue: totalRevenue[0]?.total || 0,
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error("🔥 Error getting all orders:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Get Order Analytics (Admin function)
const getOrderAnalytics = async (req, res) => {
  try {
    const { period = "30d" } = req.query;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "7d":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(startDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const dateQuery = {
      orderDate: { $gte: startDate, $lte: endDate },
    };

    // Total orders and revenue
    const totalStats = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          paidRevenue: {
            $sum: {
              $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$totalAmount", 0],
            },
          },
        },
      },
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$orderStatus",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Orders by payment method
    const ordersByPaymentMethod = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Daily order trends
    const dailyTrends = await Order.aggregate([
      { $match: dateQuery },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$orderDate" },
          },
          orders: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top products
    const topProducts = await Order.aggregate([
      { $match: dateQuery },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: {
              $multiply: ["$items.quantity", "$items.priceAtTimeOfAdding"],
            },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "goldproducts",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    res.status(200).json({
      message: "Analytics retrieved successfully",
      period,
      dateRange: { startDate, endDate },
      summary: totalStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        paidRevenue: 0,
      },
      ordersByStatus,
      ordersByPaymentMethod,
      dailyTrends,
      topProducts,
    });
  } catch (error) {
    console.error("🔥 Error getting order analytics:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,

  verifyOrder,
  getUserOrders,
  getOrderById,
  // cancelOrder,
  // handleCashfreeWebhook,
  // updateOrderStatus,
  getAllOrders,
  // getOrderAnalytics,
  // retryPayment
};
