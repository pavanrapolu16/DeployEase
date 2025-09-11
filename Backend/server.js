const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');

// Load environment variables FIRST
dotenv.config();

// Import passport AFTER environment variables are loaded
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the Nginx proxy to get correct protocol (https)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.CORS_ORIGIN
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware for OAuth
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Subdomain routing middleware (must be before API routes)
const subdomainHandler = require('./middleware/subdomain');
app.use(subdomainHandler);

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/deployease');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    console.log('Note: Make sure MongoDB is running on your system');
    // Don't exit in development, continue without DB for now
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'DeployEase Backend API is running!' });
});

// Auth routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auth-test', require('./routes/auth-test'));
app.use('/api/oauth', require('./routes/oauth'));
app.use('/api/github', require('./routes/github'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/deployments', require('./routes/deployments'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
