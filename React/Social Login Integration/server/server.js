import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security and transport middlewares
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin || /^http:\/\/localhost:(5173|5174|5175|3000)$/.test(origin) || /^http:\/\/127\.0\.0\.1:(5173|5174|5175|3000)$/.test(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Dev environment permissive
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Request logger for security audit transparency
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
  }
  next();
});

// Mount auth API routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AuthMesh Identity Gateway API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    supportedProviders: ['google', 'github', 'facebook']
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: 'INTERNAL_SERVER_ERROR',
    message: err.message || 'An unexpected server error occurred.'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 AuthMesh Identity Gateway API listening on http://localhost:${PORT}`);
  console.log(`🔐 Providers enabled: Google (PKCE), GitHub, Facebook`);
});
