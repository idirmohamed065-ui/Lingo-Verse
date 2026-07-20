import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }
});

// Global middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
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

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
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
