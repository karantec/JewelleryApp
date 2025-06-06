const Order = require("../models/Order.model");
const Cart = require("../models/Cart.model");
const GoldProduct = require("../models/GoldProduct.model");

// 🔹 Create Order with Cashfree Payment Gateway
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

    // ✅ Cashfree payment method with max limit check
    if (paymentMethod === "ONLINE") {
      const MAX_CASHFREE_AMOUNT = 1000000; // ₹10,00,000 (Cashfree's typical limit)

      if (totalAmount > MAX_CASHFREE_AMOUNT) {
        return res.status(400).json({
          message:
            "Order amount exceeds Cashfree's ₹10,00,000 limit. Please split your cart.",
        });
      }

      // Generate unique order ID for Cashfree
      const cashfreeOrderId = `order_${Date.now()}_${cart._id
        .toString()
        .slice(-6)}`;

      // Cashfree order creation payload
      const cashfreeOrderPayload = {
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
          return_url: `${process.env.FRONTEND_URL}/payment/success`,
          notify_url: `${process.env.BACKEND_URL}/api/payment/cashfree/webhook`,
        },
        order_tags: {
          cart_id: cart._id.toString(),
          user_id: userId.toString(),
        },
      };

      try {
        // Create Cashfree order using your Cashfree instance
        const cashfreeOrder = await cashfree.PGCreateOrder(
          "2023-08-01",
          cashfreeOrderPayload
        );

        if (cashfreeOrder && cashfreeOrder.data) {
          newOrderData.cashfree = {
            orderId: cashfreeOrderId,
            cfOrderId: cashfreeOrder.data.cf_order_id,
            orderDetails: cashfreeOrder.data,
            paymentSessionId: cashfreeOrder.data.payment_session_id,
          };
        } else {
          throw new Error("Failed to create Cashfree order");
        }
      } catch (cashfreeError) {
        console.error("🔥 Cashfree order creation error:", cashfreeError);
        return res.status(500).json({
          message: "Failed to create payment order",
          error: cashfreeError.message,
        });
      }
    }

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

    res.status(201).json({
      message: "Order created successfully",
      order: newOrder,
      cashfreeOrder: newOrder.cashfree?.orderDetails || null,
      paymentSessionId: newOrder.cashfree?.paymentSessionId || null,
    });
  } catch (error) {
    console.error("🔥 Error creating order:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

// const verifyPayment = async (req, res) => {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       orderId, // our own order _id in DB
//     } = req.body;

//     // Step 1: Verify Razorpay signature
//     const generatedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_SECRET)
//       .update(razorpay_order_id + "|" + razorpay_payment_id)
//       .digest("hex");

//     if (generatedSignature !== razorpay_signature) {
//       return res.status(400).json({ message: "Payment verification failed" });
//     }

//     // Step 2: Update order status in DB
//     const updatedOrder = await Order.findByIdAndUpdate(
//       orderId,
//       {
//         paymentStatus: "Paid",
//         orderStatus: "ORDER PLACED",
//         "razorpay.paymentId": razorpay_payment_id,
//         "razorpay.signature": razorpay_signature,
//       },
//       { new: true }
//     );

//     if (!updatedOrder) {
//       return res.status(404).json({ message: "Order not found" });
//     }

//     res.status(200).json({
//       message: "Payment verified successfully",
//       order: updatedOrder,
//     });
//   } catch (error) {
//     console.error("🔥 Error verifying payment:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const getOrdersByUser = async (req, res) => {
//   try {
//     const { _id: userId } = req.user || {};

//     const orders = await Order.find({ userId })
//       .populate({
//         path: "cartId",
//         populate: {
//           path: "items.productId",
//           model: "GoldProduct",
//         },
//       })
//       .sort({ createdAt: -1 });

//     res.status(200).json(orders);
//   } catch (error) {
//     console.error("🔥 Error in getOrdersByUser:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

// const getOrderById = async (req, res) => {
//   try {
//     const order = await Order.findById(req.params.id).populate({
//       path: "cartId",
//       populate: {
//         path: "items.productId",
//         model: "GoldProduct",
//       },
//     });

//     if (!order) return res.status(404).json({ message: "Order not found" });

//     res.status(200).json(order);
//   } catch (error) {
//     console.error("🔥 Error in getOrderById:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };
// const getAllOrders = async (req, res) => {
//   try {
//     const orders = await Order.find()
//       .populate({
//         path: "cartId",
//         populate: {
//           path: "items.productId",
//           model: "GoldProduct",
//         },
//       })
//       .sort({ createdAt: -1 });

//     res.status(200).json(orders);
//   } catch (error) {
//     console.error("🔥 Error in getAllOrders:", error);
//     res
//       .status(500)
//       .json({ message: "Internal server error", error: error.message });
//   }
// };

module.exports = {
  createOrder,
};
//   getOrdersByUser,
//   verifyPayment,
//   getOrderById,
//   getAllOrders,
