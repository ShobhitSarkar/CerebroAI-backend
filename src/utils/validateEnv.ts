// src/utils/validateEnv.ts
import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import logger from './logger';

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

// Environment schema with detailed error messages
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    required_error: "NODE_ENV is required",
    invalid_type_error: "NODE_ENV must be 'development', 'production', or 'test'",
  }).default('development'),

  PORT: z.string().transform(Number).pipe(
    z.number().positive({
      message: "PORT must be a positive number",
    })
  ).default('3000'),

  MONGODB_URI: z.string().url({
    message: "MONGODB_URI must be a valid URL",
  }),

  REDIS_URI: z.string().url({
    message: "REDIS_URI must be a valid URL",
  }),

  OPENAI_API_KEY: z.string().min(1, {
    message: "OPENAI_API_KEY is required",
  }),

  MAX_FILE_SIZE: z.string().transform(Number).pipe(
    z.number().positive({
      message: "MAX_FILE_SIZE must be a positive number",
    })
  ).default('5242880'),

  BATCH_SIZE: z.string().transform(Number).pipe(
    z.number().positive({
      message: "BATCH_SIZE must be a positive number",
    })
  ).default('5'),

  MAX_RETRIES: z.string().transform(Number).pipe(
    z.number().nonnegative({
      message: "MAX_RETRIES must be a non-negative number",
    })
  ).default('3'),

  RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(
    z.number().positive({
      message: "RATE_LIMIT_WINDOW must be a positive number",
    })
  ).default('3600000'),

  RATE_LIMIT_MAX: z.string().transform(Number).pipe(
    z.number().positive({
      message: "RATE_LIMIT_MAX must be a positive number",
    })
  ).default('100'),

  ALLOWED_ORIGINS: z.string().transform((str) => str.split(',')).pipe(
    z.array(z.string().url({
      message: "ALLOWED_ORIGINS must be a comma-separated list of valid URLs",
    }))
  ),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug'], {
    required_error: "LOG_LEVEL is required",
    invalid_type_error: "LOG_LEVEL must be one of: error, warn, info, debug",
  }).default('info'),
});

// Type for validated environment
export type ValidatedEnv = z.infer<typeof envSchema>;

// Validate environment variables
export const validateEnv = (): ValidatedEnv => {
  loadEnvFile();

  try {
    const validatedEnv = envSchema.parse(process.env);
    logger.info('Environment validation successful');
    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => {
        return `${err.path.join('.')}: ${err.message}`;
      });
      
      logger.error('Environment validation failed:', {
        errors: errorMessages
      });
      
      throw new Error('Invalid environment configuration:\n' + errorMessages.join('\n'));
    }
    
    throw error;
  }
};