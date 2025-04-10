const express = require('express');
const createError = require('http-errors');
const morgan = require('morgan');
const cors = require('cors');
const connectDB = require('./config/db');
const UserRoutes=require('./routes/user.routes')
const GoldRoutes=require('./routes/product.routes');
const homePageRoutes=require('./routes/Home.routes');
const OrderRoutes=require('./routes/Order.routes');
const AdminRoutes=require('./routes/Admin.Routes');
const addressRoutes = require('./routes/address.routes'); 
const CategoryRoutes=require('./routes/Category.routes');
const blogRoutes=require('./routes/blog.routes');
const CartRoutes=require('./routes/Cart.routes');
const AboutRoutes=require('./routes/About.routes');
const GoldPriceRoutes=require('./routes/Price.routes');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Example route
app.get('/', async (req, res, next) => {
  res.send({ message: 'Awesome it works 🐻' });
});

app.options('*', cors()); 
// OR Enable CORS with specific options
app.use(
  cors({
    origin: [
      'https://jewellery-app-dashboard.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://ecommerce-flax-chi.vercel.app' // <-- removed trailing slash here
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  })
);

// app.use('/api', require('./routes/api.route'));
app.use('/auth', UserRoutes);
app.use('/gold',GoldRoutes);
app.use("/home", homePageRoutes);
app.use('/order',OrderRoutes); 
app.use('/address', addressRoutes);
app.use('/blog',blogRoutes)
app.use('/category', CategoryRoutes);
app.use('/about',AboutRoutes)
app.use('/today-price',GoldPriceRoutes)
app.use('/cart',CartRoutes)
app.use('/admin',AdminRoutes);
// Middleware for handling 404 errors
app.use((req, res, next) => {
  next(createError.NotFound());
});
require('./services/priceUpdater');
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
  console.log('📂 Available Routes:');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Regular routes
      const method = Object.keys(middleware.route.methods).join(', ').toUpperCase();
      console.log(`${method} ${baseUrl}${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Nested router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const method = Object.keys(handler.route.methods).join(', ').toUpperCase();
          console.log(`${method} ${baseUrl}${handler.route.path}`);
        }
      });
    }
  });
};

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

app.listen(PORT, () => {
  console.log(`🚀 Server running at ${BASE_URL}`);
  listRoutes(app, BASE_URL); // Log all routes with full URLs
});
