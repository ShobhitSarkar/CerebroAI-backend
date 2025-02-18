// src/services/VectorSearchService.ts
import mongoose from 'mongoose';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import Document, { IDocument, IChunk } from '../models/Document';

export class VectorSearchService {
  private readonly VECTOR_DIMENSION = 384; // This will match our chosen embedding model's dimension

  async createSearchIndex(): Promise<void> {
    try {
      const collection = mongoose.connection.collection('documents');
      
      // Check if index already exists
      const indexes = await collection.listIndexes().toArray();
      const vectorIndexExists = indexes.some(index => index.name === 'vectorIndex');
      
      if (!vectorIndexExists) {
        await collection.createIndex(
          { 'chunks.embedding': 1 },
          {
            name: 'vectorIndex',
            // @ts-ignore - MongoDB Atlas specific options
            vectorSearchOptions: {
              dimension: this.VECTOR_DIMENSION,
              similarity: 'cosine'
            }
          }
        );
        logger.info('Vector search index created successfully');
      } else {
        logger.info('Vector search index already exists');
      }
    } catch (error) {
      logger.error('Error creating vector search index:', error);
      throw new AppError(500, 'Failed to create vector search index');
    }
  }

  async searchSimilarChunks(
    queryVector: number[],
    userId: mongoose.Types.ObjectId,
    limit: number = 5
  ): Promise<Array<{ chunk: IChunk; score: number; documentId: string }>> {
    if (queryVector.length !== this.VECTOR_DIMENSION) {
      throw new AppError(400, `Query vector must have dimension ${this.VECTOR_DIMENSION}`);
    }

    try {
      // @ts-ignore - MongoDB Atlas vector search syntax
      const results = await Document.aggregate([
        {
          $search: {
            vectorSearch: {
              queryVector: queryVector,
              path: "chunks.embedding",
              numCandidates: limit * 10,
              limit: limit
            },
            index: "vectorIndex"
          }
        },
        {
          $match: {
            userId: userId
          }
        },
        {
          $unwind: "$chunks"
        },
        {
          $project: {
            _id: 1,
            chunk: "$chunks",
            score: { $meta: "vectorSearchScore" }
          }
        },
        {
          $limit: limit
        }
      ]);

      return results.map(result => ({
        chunk: result.chunk,
        score: result.score,
        documentId: result._id.toString()
      }));
    } catch (error) {
      logger.error('Error performing vector search:', error);
      throw new AppError(500, 'Failed to perform vector search');
    }
  }

  async deleteSearchIndex(): Promise<void> {
    try {
      const collection = mongoose.connection.collection('documents');
      await collection.dropIndex('vectorIndex');
      logger.info('Vector search index deleted successfully');
    } catch (error) {
      logger.error('Error deleting vector search index:', error);
      throw new AppError(500, 'Failed to delete vector search index');
    }
  }
}

export default VectorSearchService;