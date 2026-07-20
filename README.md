# LingoVerse - AI-Powered Language Learning Platform

## Overview

LingoVerse is a full-stack language learning application built with Node.js, Express, PostgreSQL, Redis, React, and AI integration.

## Features

### Part 1 (Core)
- User authentication (JWT-based)
- Course and lesson management
- Interactive quizzes (multiple choice, translation, fill blank)
- Progress tracking with XP and levels
- Streak system
- User profiles
- Email notifications
- Redis caching

### Part 2 (Extended)
- **AI Tutor**: Chat with GPT-4 powered language tutor
- **Social Feed**: Share progress, posts, comments, likes
- **Friends System**: Friend requests, search, activity feed
- **Pronunciation Practice**: Speech recognition and scoring
- **Leaderboards**: Global, friends, and language-specific
- **Achievements & Badges**: Automated badge awarding system
- **Streak Management**: Freeze streaks, recovery lessons
- **Admin Dashboard**: User management, content moderation, analytics
- **Payments**: Stripe integration for Premium/Pro subscriptions
- **Real-time**: WebSocket support for live notifications
- **PWA**: Progressive Web App support

## Tech Stack

### Backend
- Node.js 18+ with Express
- PostgreSQL 15 with Sequelize ORM
- Redis 7 for caching and sessions
- OpenAI GPT-4 for AI tutor
- Stripe for payments
- Socket.io for real-time features
- Nginx reverse proxy

### Frontend
- React 18 with Vite
- Tailwind CSS
- Zustand for state management
- React Query for data fetching
- Socket.io client
- PWA with offline support

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15
- Redis 7

### Environment Setup
```bash
cp .env.example .env
# Edit .env with your credentials
```

### Database Setup
```bash
npm run db:setup
npm run db:migrate
npm run db:seed
```

### Development
```bash
# Backend
npm run dev

# Frontend (separate terminal)
cd frontend && npm run dev
```

### Production (Docker)
```bash
docker-compose up -d
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/me` - Get current user

### Users
- `GET /api/users/profile/:userId` - Get profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/stats` - Get stats
- `GET /api/users/badges` - Get badges

### Courses & Lessons
- `GET /api/courses/languages` - List languages
- `GET /api/courses` - List courses
- `GET /api/courses/:courseId` - Get course details
- `GET /api/courses/lessons/:lessonId` - Get lesson
- `POST /api/courses/lessons/:lessonId/submit` - Submit answers

### Progress
- `GET /api/progress/overview` - Overall progress
- `GET /api/progress/daily` - Daily stats
- `GET /api/progress/weekly` - Weekly stats
- `GET /api/progress/skills` - Skill breakdown

### AI Tutor (Part 2)
- `POST /api/ai-tutor/sessions` - Create session
- `GET /api/ai-tutor/sessions` - List sessions
- `POST /api/ai-tutor/sessions/:id/message` - Send message
- `POST /api/ai-tutor/grammar-check` - Check grammar
- `POST /api/ai-tutor/generate-lesson` - Generate custom lesson

### Social (Part 2)
- `GET /api/social/feed` - Get feed
- `POST /api/social/posts` - Create post
- `POST /api/social/posts/:id/like` - Like post
- `POST /api/social/posts/:id/comments` - Add comment

### Friends (Part 2)
- `GET /api/friends/search` - Search users
- `POST /api/friends/request` - Send request
- `PATCH /api/friends/request/:id` - Respond to request
- `GET /api/friends/list` - List friends
- `GET /api/friends/pending` - Pending requests

### Pronunciation (Part 2)
- `POST /api/pronunciation/attempt` - Submit attempt
- `GET /api/pronunciation/history` - Get history
- `GET /api/pronunciation/stats` - Get stats

### Leaderboard (Part 2)
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/friends` - Friends leaderboard
- `GET /api/leaderboard/language/:id` - Language leaderboard

### Achievements (Part 2)
- `GET /api/achievements/badges` - All badges
- `GET /api/achievements/my-badges` - User badges
- `POST /api/achievements/check-badges` - Check for new badges
- `GET /api/achievements/progress` - Badge progress

### Streaks (Part 2)
- `GET /api/streaks/current` - Current streak
- `GET /api/streaks/history` - Streak history
- `POST /api/streaks/freeze` - Freeze streak
- `POST /api/streaks/recover` - Recover streak

### Admin (Part 2)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/users` - User list
- `PATCH /api/admin/users/:id/status` - Update user status
- `GET /api/admin/moderation/posts` - Moderate posts

### Payments (Part 2)
- `POST /api/payments/create-subscription` - Create subscription
- `GET /api/payments/subscription` - Get subscription
- `POST /api/payments/cancel-subscription` - Cancel
- `GET /api/payments/plans` - Pricing plans
- `POST /api/payments/webhook` - Stripe webhook

## License

MIT
