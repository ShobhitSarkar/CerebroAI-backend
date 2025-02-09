// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import config from '../config/index';

export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW,
  max: config.RATE_LIMIT_MAX,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});