import './config/env.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDatabase } from './models/index.js';
import { connectRedis } from './utils/redis.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';

// Routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import lessonRoutes from './routes/lessons.js';
import progressRoutes from './routes/progress.js';
import socialRoutes from './routes/social.js';
import friendRoutes from './routes/friends.js';
import aiTutorRoutes from './routes/ai-tutor.js';
import pronunciationRoutes from './routes/pronunciation.js';
import adminRoutes from './routes/admin.js';
import paymentRoutes from './routes/payments.js';
import notificationRoutes from './routes/notifications.js';
import leaderboardRoutes from './routes/leaderboard.js';
import achievementRoutes from './routes/achievements.js';
import streakRoutes from './routes/streaks.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Trust the first hop (Render/nginx proxy) so req.ip and
// express-rate-limit see the real client X-Forwarded-For address.
app.set('trust proxy', 1);

// Allowed frontend origins. Defaults cover local dev + the production Vercel
// domain + any Vercel preview subdomain. Override with CORS_ORIGINS
// (comma-separated) or by setting FRONTEND_URL to the exact production origin.
const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'https://lingoverse-henna.vercel.app'
];
const FRONTEND_URL = process.env.FRONTEND_URL;
const allowedOrigins = (process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : [...defaultOrigins, ...(FRONTEND_URL ? [FRONTEND_URL] : [])]
).map((o) => o.trim()).filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow non-browser requests (server-to-server, Stripe webhooks, tools).
    if (!origin) return callback(null, true);
    // Allow the listed origins and any Vercel preview subdomain.
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions
});

// Global middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Stripe webhook needs raw body - must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiRateLimiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/ai-tutor', aiTutorRoutes);
app.use('/api/pronunciation', pronunciationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/streaks', streakRoutes);

// Optionally serve the built frontend if it exists (e.g. single-server deploy).
// The API is deployed separately on Render; the frontend is on Vercel.
// Guard with existsSync so the backend does not crash with ENOENT when
// frontend/dist is absent in this deployment.
const frontendDist = path.join(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('join-room', (userId) => {
    socket.join(`user:${userId}`);
  });

  socket.on('leave-room', (userId) => {
    socket.leave(`user:${userId}`);
  });

  socket.on('ai-tutor-message', async (data) => {
    // Broadcast to user's room
    socket.to(`user:${data.userId}`).emit('ai-tutor-response', data);
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

// Make io accessible to routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDatabase();
    await connectRedis();

    httpServer.listen(PORT, () => {
      console.log(`\u2705 Server running on port ${PORT}`);
      console.log(`\ud83d\udcbe Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('\u274c Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export { io };

