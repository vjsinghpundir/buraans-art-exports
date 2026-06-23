require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fileUpload = require('express-fileupload');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const itemRoutes = require('./routes/itemRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const billRoutes = require('./routes/billRoutes');
const bulkOrderRoutes = require('./routes/bulkOrderRoutes');

// Connect to Database
connectDB();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/'
}));

// Serve static uploads
app.use('/uploads', express.static(uploadsDir));

// Request Logger (simple middleware)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/items', itemRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/bulk-orders', bulkOrderRoutes);

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to Buraans Art Exports Backend API',
    status: 'Running',
    version: '1.0.0',
  });
});

// Handle 404 Error (Route Not Found)
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
