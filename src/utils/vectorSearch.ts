// src/utils/vectorSearch.ts
import mongoose from 'mongoose';
import { VectorSearchService } from '../services/VectorSearchService';
import { AppError } from './errors';
import logger from './logger';

export async function initializeVectorSearch(): Promise<void> {
  try {
    const vectorSearchService = new VectorSearchService();
    await vectorSearchService.createSearchIndex();
    logger.info('Vector search initialization completed');
  } catch (error) {
    logger.error('Failed to initialize vector search:', error);
    throw error;
  }
}

export async function validateVectorSearchConfig(): Promise<boolean> {
  try {
    if (!mongoose.connection.readyState) {
      throw new AppError(500, 'MongoDB connection not established');
    }

    if (!mongoose.connection.db) {
      throw new AppError(500, 'MongoDB database not initialized');
    }

    // Check if MongoDB Atlas cluster supports vector search
    const adminDb = mongoose.connection.db.admin();
    const serverInfo = await adminDb.command({ buildInfo: 1 });
    
    // Vector search requires MongoDB 7.0 or later
    const version = parseInt(serverInfo.version.split('.')[0]);
    if (version < 7) {
      throw new Error('MongoDB version 7.0 or later is required for vector search');
    }

    // Check if the deployment supports vector search
    const vectorSearchAvailable = serverInfo.vectorSearch?.available === true;
    if (!vectorSearchAvailable) {
      throw new Error('Vector search is not available on this MongoDB deployment');
    }

    return true;
  } catch (error) {
    logger.error('Vector search validation failed:', error);
    return false;
  }
}