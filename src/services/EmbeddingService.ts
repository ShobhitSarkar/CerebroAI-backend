// src/services/EmbeddingService.ts
import { AppError } from '../utils/errors';
import logger from '../utils/logger';
import { IChunk } from '../models/Document';

export interface IEmbeddingProvider {
  generateEmbedding(text: string): Promise<number[]>;
  batchGenerateEmbeddings(texts: string[]): Promise<number[][]>;
}

export class EmbeddingService {
  private provider: IEmbeddingProvider;
  private readonly BATCH_SIZE = 5;

  constructor(provider: IEmbeddingProvider) {
    this.provider = provider;
  }

  async generateEmbeddings(chunks: IChunk[]): Promise<IChunk[]> {
    try {
      const chunksWithEmbeddings = [...chunks];
      
      // Process chunks in batches
      for (let i = 0; i < chunks.length; i += this.BATCH_SIZE) {
        const batch = chunks.slice(i, i + this.BATCH_SIZE);
        const texts = batch.map(chunk => chunk.content);
        
        const embeddings = await this.provider.batchGenerateEmbeddings(texts);
        
        embeddings.forEach((embedding, index) => {
          chunksWithEmbeddings[i + index].embedding = embedding;
        });

        // Add a small delay between batches to avoid rate limiting
        if (i + this.BATCH_SIZE < chunks.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      return chunksWithEmbeddings;
    } catch (error) {
      logger.error('Error generating embeddings:', error);
      throw new AppError(500, 'Failed to generate embeddings');
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      return await this.provider.generateEmbedding(text);
    } catch (error) {
      logger.error('Error generating single embedding:', error);
      throw new AppError(500, 'Failed to generate embedding');
    }
  }
}

// This will be replaced with actual implementation once we choose the embedding model
export class MockEmbeddingProvider implements IEmbeddingProvider {
  private readonly MOCK_DIMENSION = 384;

  async generateEmbedding(text: string): Promise<number[]> {
    // Generate mock embedding for testing
    return Array.from({ length: this.MOCK_DIMENSION }, 
      () => Math.random() * 2 - 1);
  }

  async batchGenerateEmbeddings(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
}