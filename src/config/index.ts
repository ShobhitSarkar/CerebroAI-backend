// src/config/index.ts
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';

// Load environment-specific .env file
const loadEnvFile = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  logger.info(`Current NODE_ENV: ${nodeEnv}`);
  
  const envPath = path.resolve(process.cwd(), `.env.${nodeEnv}`);
  logger.info(`Looking for env file at: ${envPath}`);
  
  const result = dotenv.config({ path: envPath });
  
  if (result.error) {
    logger.warn(`No .env.${nodeEnv} file found at ${envPath}, falling back to .env`);
    const defaultResult = dotenv.config();
    if (defaultResult.error) {
      logger.error('No .env file found either');
      throw new Error('No environment file found');
    }
    logger.info('Successfully loaded .env file');
  } else {
    logger.info(`Successfully loaded .env.${nodeEnv} file`);
  }
};

// Load environment variables
loadEnvFile();

interface Config {
  PORT: number;
  MONGODB_URI: string;
  REDIS_URI: string;
  OPENAI_API_KEY: string;
  NODE_ENV: string;
  MAX_FILE_SIZE: number;
  BATCH_SIZE: number;
  MAX_RETRIES: number;
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;
  ALLOWED_ORIGINS: string[];
}

const config: Config = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/cerebro-ai',
  REDIS_URI: process.env.REDIS_URI || 'redis://localhost:6379',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '5', 10),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3', 10),
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || '3600000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:19006']
};

// Log configuration (without sensitive data)
logger.debug('Configuration loaded:', {
  NODE_ENV: config.NODE_ENV,
  MONGODB_URI: config.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'),
  PORT: config.PORT
});

export default config;