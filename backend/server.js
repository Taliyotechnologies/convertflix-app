const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { connectDB } = require('./config/db');
const { cleanupOldUploads, cleanupOldData } = require('./utils/retention');
const { getSettings } = require('./utils/dataStore');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
// Robust CORS fallback: always echo Origin and handle OPTIONS early (some hosts strip headers on 404/500)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
  }
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With, X-Tools-Speed, X-Speed-Preset');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});
// CORS: reflect origin, allow common methods/headers, handle preflight
const corsOptions = {
  origin: (origin, cb) => cb(null, true),
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Tools-Speed', 'X-Speed-Preset'],
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
app.use('/api/public', require('./routes/public'));

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

  // Schedule retention cleanup (default 7 days); run once on startup and then daily at 3 AM
  async function runCleanup() {
    try {
      const settings = await getSettings().catch(() => ({}));
      const days = Number(settings && settings.autoDeleteDays) || 7;
      const { count } = await cleanupOldUploads(days);
      if (count > 0) {
        console.log(`🧹 Retention cleanup removed ${count} old file(s) (> ${days} day(s))`);
      }
      // Prune dashboard data (activities + metrics byDay) to last N days (same as autoDeleteDays)
      await cleanupOldData(days);
      console.log(`✅ Retention cleanup completed at ${new Date().toISOString()}`);
    } catch (e) {
      console.error('Retention cleanup run error:', e && e.message ? e.message : e);
    }
  }
  
  // Run cleanup on startup
  runCleanup();
  
  // Schedule daily cleanup at 3 AM
  function scheduleDailyCleanup() {
    const now = new Date();
    const target = new Date(now);
    target.setHours(3, 0, 0, 0);
    if (now >= target) {
      target.setDate(target.getDate() + 1); // Set to tomorrow 3 AM if it's already past 3 AM today
    }
    
    const timeUntilTarget = target.getTime() - now.getTime();
    
    setTimeout(() => {
      runCleanup();
      // Schedule next day
      scheduleDailyCleanup();
    }, timeUntilTarget);
    
    console.log(`⏰ Next retention cleanup scheduled for: ${target.toISOString()}`);
  }
  
  // Start the daily cleanup scheduler
  scheduleDailyCleanup();
});

module.exports = app;
