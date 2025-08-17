const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./config/db');
const { cleanupOldUploads } = require('./utils/retention');
const { getSettings } = require('./utils/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
// CORS: reflect origin, allow common methods/headers, handle preflight
const corsOptions = {
  origin: (origin, cb) => cb(null, true),
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tools', require('./routes/tools'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ConvertFlix API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Connect to database (if MONGODB_URI provided)
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 ConvertFlix Backend running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

  // Schedule retention cleanup (default 1 day); run once on startup and hourly
  async function runCleanup() {
    try {
      const settings = await getSettings().catch(() => ({}));
      const days = Number(settings && settings.autoDeleteDays) || 1;
      const { count } = await cleanupOldUploads(days);
      if (count > 0) {
        console.log(`🧹 Retention cleanup removed ${count} old file(s) (> ${days} day(s))`);
      }
    } catch (e) {
      console.error('Retention cleanup run error:', e && e.message ? e.message : e);
    }
  }
  runCleanup();
  setInterval(runCleanup, 60 * 60 * 1000);
});

module.exports = app;
