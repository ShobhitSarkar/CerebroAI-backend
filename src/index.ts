// src/index.ts
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import path from 'path';
import config from './config';
import { errorHandler } from './middleware/errorHandler';
import { securityHeaders, corsOptions, sanitizeInput } from './middleware/security';
import routes from './api/routes';
import logger from './utils/logger';
import { initializeVectorSearch, validateVectorSearchConfig } from './utils/vectorSearch';

logger.info('Starting application initialization...');

const app = express();
logger.info('Express app created');

// Security middleware
try {
  app.use(securityHeaders);
  app.use(cors(corsOptions));
  logger.info('Security middleware initialized');
} catch (error) {
  logger.error('Error initializing security middleware:', error);
  process.exit(1);
}

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(sanitizeInput);

// Create uploads directory if it doesn't exist
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
logger.info('Static middleware initialized');

// Routes
app.use('/api', routes);
logger.info('Routes initialized');

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date(),
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      redis: app.get('redis') ? 'connected' : 'disconnected'
    }
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  errorHandler(err, req, res, next);
});

// Database connection
const connectDB = async () => {
  logger.info('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(config.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis connection
const connectRedis = async () => {
  if (process.env.NODE_ENV === 'development') {
    logger.info('Skipping Redis connection in development mode');
    return null;
  }

  logger.info('Attempting to connect to Redis...');
  try {
    const client = createClient({
      url: config.REDIS_URI
    });

    client.on('error', (err) => logger.error('Redis Client Error:', err));
    client.on('connect', () => logger.info('Redis connected successfully'));

    await client.connect();
    return client;
  } catch (error) {
    logger.error('Redis connection error:', error);
    return null;
  }
};

// Start server
const startServer = async () => {
  logger.info('Starting server...');
  try {
    await connectDB();
    
    // Validate and initialize vector search
    const vectorSearchSupported = await validateVectorSearchConfig();
    if (!vectorSearchSupported) {
      logger.error('Vector search is not supported on this MongoDB deployment');
      process.exit(1);
    }
    
    await initializeVectorSearch();
    logger.info('Vector search initialized successfully');
    
    // Make Redis optional in development
    const redisClient = await connectRedis();
    if (redisClient) {
      app.set('redis', redisClient);
    }
    
    app.listen(config.PORT, () => {
      logger.info(`Server is running on port ${config.PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};


// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

logger.info('Starting server initialization...');
startServer().catch((error) => {
  logger.error('Error during server initialization:', error);
  process.exit(1);
});

export default app;