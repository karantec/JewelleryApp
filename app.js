const express = require("express");
const createError = require("http-errors");
const morgan = require("morgan");
const cors = require("cors");
const listEndpoints = require("express-list-endpoints");
const connectDB = require("./config/db");
const UserRoutes = require("./routes/user.routes");
const GoldRoutes = require("./routes/product.routes");
const ShopRoutes = require("./routes/Shop3.route");
const OrderRoutes = require("./routes/Order.routes");
const AdminRoutes = require("./routes/Admin.Routes");
const GiftingRoutes = require("./routes/Gifting.routes");
const addressRoutes = require("./routes/address.routes");
const CategoryRoutes = require("./routes/Category.routes");
const FeatureRoutes = require("./routes/Feature.routes");
const blogRoutes = require("./routes/blog.routes");
const InstagramRoutes = require("./routes/Instagram.routes");
const EveryRoutes = require("./routes/EveryDay.routes");
const ShopsRoutes = require("./routes/Shop3.route");
const CartRoutes = require("./routes/Cart.routes");
const BestRoutes = require("./routes/Best.route");
const SupportRoutes = require("./routes/Support.routes");
const AboutRoutes = require("./routes/About.routes");
const RelatedRoutes = require("./routes/Related.routes");
const TicketRoutes = require("./routes/Ticket.routes");
const TestimonialRoutes = require("./routes/Testimonial.routes");
const crouselRoutes = require("./routes/Crousel.routes");
const GoldPriceRoutes = require("./routes/Price.routes");
const WishlistRoutes = require("./routes/Wishlist.routes");
const AppBannerRoutes = require("./routes/AppBanner.routes");
require("dotenv").config();

const app = express();
app.use(express.json());

// Parse URL-encoded data (for forms)
console.log(listEndpoints(app));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Example route
app.get("/", async (req, res, next) => {
  res.send({ message: "Awesome it works 🐻" });
});

app.options("*", cors());
// OR Enable CORS with specific options
app.use(
  cors({
    origin: [
      "https://jewellery-app-dashboard.vercel.app",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://srilaxmialankar.com",
      "https://dashboard.srilaxmialankar.com", // <-- removed trailing slash here
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// app.use('/api', require('./routes/api.route'));
app.use("/auth", UserRoutes);
app.use("/gold", GoldRoutes);
app.use("/about", AboutRoutes);
app.use("/order", OrderRoutes);
app.use("/crousel", crouselRoutes);
app.use("/address", addressRoutes);
app.use("/support", SupportRoutes);
app.use("/blog", blogRoutes);
app.use("/category", CategoryRoutes);
app.use("/shop", ShopRoutes);
app.use("/gifting", GiftingRoutes);
app.use("/ticket", TicketRoutes);
app.use("/shopdetails", ShopsRoutes);
app.use("/today-price", GoldPriceRoutes);
app.use("/cart", CartRoutes);
app.use("/related", RelatedRoutes);
app.use("/instagram", InstagramRoutes);
app.use("/admin", AdminRoutes);
app.use("/testimonial", TestimonialRoutes);
app.use("/best", BestRoutes);
app.use("/feature", FeatureRoutes);
app.use("/Everyday", EveryRoutes);
app.use("/appbanner", AppBannerRoutes);
app.use("/wishlist", WishlistRoutes);

// Middleware for handling 404 errors
app.use((req, res, next) => {
  next(createError.NotFound());
});

app.get("/health", (req, res) => {
  console.log("Health check hit"); // Add this
  res.status(200).send("OK");
});

app.get("/", (req, res) => {
  console.log("Root route hit"); // Add this
  res.send({ message: "Awesome it works 🐻" });
});
require("./services/priceUpdater");
// Error handling middleware
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    status: err.status || 500,
    message: err.message,
  });
});

// Connect to the database
connectDB();

// Function to log all routes with full URLs
const listRoutes = (app, baseUrl) => {
  console.log("📂 Available Routes:");
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Regular routes
      const method = Object.keys(middleware.route.methods)
        .join(", ")
        .toUpperCase();
      console.log(`${method} ${baseUrl}${middleware.route.path}`);
    } else if (middleware.name === "router") {
      // Nested router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = Object.keys(handler.route.methods)
            .join(", ")
            .toUpperCase();
          console.log(`${method} ${baseUrl}${handler.route.path}`);
        }
      });
    }
  });
};

const PORT = process.env.PORT;
if (!PORT) {
  console.error("❌ PORT not set. Azure App Service needs process.env.PORT.");
  process.exit(1);
}
const BASE_URL = `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`🚀 Server running at ${BASE_URL}`);
  listRoutes(app, BASE_URL); // Log all routes with full URLs
});
