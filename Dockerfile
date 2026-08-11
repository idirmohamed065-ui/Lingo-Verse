# Build frontend
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Backend build
FROM node:18-alpine AS backend-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY backend/ ./backend/
COPY config/ ./config/

# Runtime
FROM node:18-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=backend-build /app /app
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

# Create uploads and logs directories
RUN mkdir -p /app/uploads /app/logs

EXPOSE 5000

CMD ["node", "backend/server.js"]