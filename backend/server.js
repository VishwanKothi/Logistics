const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

const config = require('./config/config');
const { errorHandler } = require('./middleware/auth');

// Import routes
const userRoutes = require('./routes/userRoutes');
const orderRoutes = require('./routes/orderRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const exceptionRoutes = require('./routes/exceptionRoutes');
const deliveryProofRoutes = require('./routes/deliveryProofRoutes');
const billingRoutes = require('./routes/billingRoutes');
const warehouseRoutes = require('./routes/warehouseRoutes');

// Initialize Express app
const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const fs = require('fs');
if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}
app.use('/uploads', express.static(config.UPLOAD_DIR));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/delivery-proofs', deliveryProofRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/warehouses', warehouseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use(errorHandler);

// Start server only when run directly (not when imported by tests)
if (require.main === module) {
  const PORT = config.PORT;
  app.listen(PORT, () => {
    console.log(`🚀 Logistics Operations Platform Backend`);
    console.log(`📍 Server running on http://localhost:${PORT}`);
    console.log(`🔧 Environment: ${config.NODE_ENV}`);
  });
}

module.exports = app;
