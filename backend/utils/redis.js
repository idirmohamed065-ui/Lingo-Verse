import Redis from 'ioredis';

let redis = null;

export const connectRedis = async () => {
  try {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      retryStrategy: (times) => Math.min(times * 50, 2000),
      maxRetriesPerRequest: 3
    });

    redis.on('connect', () => {
      console.log('\u2705 Redis connected');
    });

    redis.on('error', (err) => {
      console.error('Redis error:', err);
    });

    return redis;
  } catch (error) {
    console.error('Redis connection failed:', error);
    // Continue without Redis in development
    if (process.env.NODE_ENV !== 'production') {
      console.log('\u26a0\ufe0f Running without Redis (development mode)');
      return null;
    }
    throw error;
  }
};

export const getRedis = () => redis;

export const cacheGet = async (key) => {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const cacheSet = async (key, value, ttl = 3600) => {
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    console.error('Cache set error:', error);
  }
};

export const cacheDelete = async (key) => {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

export const cacheInvalidatePattern = async (pattern) => {
  if (!redis) return;
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
};
