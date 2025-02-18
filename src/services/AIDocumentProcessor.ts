// src/services/AIDocumentProcessor.ts
import { Types } from 'mongoose';
import { DocumentService } from './document.service';
import { EmbeddingService, MockEmbeddingProvider } from './EmbeddingService';
import Document, { IDocument, IChunk } from '../models/Document';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export class AIDocumentProcessor {
  private documentService: DocumentService;
  private embeddingService: EmbeddingService;
  private readonly DEFAULT_CHUNK_SIZE = 1000; // characters
  private readonly DEFAULT_CHUNK_OVERLAP = 200; // characters

  constructor() {
    this.documentService = new DocumentService();
    // Using mock provider for now - will be replaced with actual provider
    this.embeddingService = new EmbeddingService(new MockEmbeddingProvider());
  }

  async processDocument(
    file: Express.Multer.File,
    userId: Types.ObjectId,
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
    }
  ): Promise<string> {
    try {
      // First, process the document using the existing service
      const documentId = await this.documentService.processDocument(file);
      const document = await Document.findById(documentId) as IDocument | null;

      if (!document) {
        throw new AppError(404, 'Document not found after processing');
      }

      // Update the document with user ID
      document.userId = userId;
      document.processingStatus = 'processing';
      document.vectorizationStatus = 'pending';
      await document.save();

      // Process the document content
      await this.processContent(document, options);

      return document._id.toString();
    } catch (error) {
      logger.error('Error in AI document processing:', error);
      throw new AppError(500, 'Failed to process document for AI features');
    }
  }

  private async processContent(
    document: IDocument,
    options?: {
      chunkSize?: number;
      chunkOverlap?: number;
    }
  ): Promise<void> {
    try {
      const chunkSize = options?.chunkSize || this.DEFAULT_CHUNK_SIZE;
      const chunkOverlap = options?.chunkOverlap || this.DEFAULT_CHUNK_OVERLAP;

      // Create chunks from the content
      const chunks = this.createChunks(document.content, chunkSize, chunkOverlap);
      
      // Generate embeddings for chunks
      document.chunks = await this.embeddingService.generateEmbeddings(chunks);
      
      // Update document metadata
      document.metadata = {
        totalChunks: chunks.length,
        wordCount: document.content.split(/\s+/).length,
        lastProcessed: new Date(),
      };
      
      document.processingStatus = 'completed';
      document.vectorizationStatus = 'completed';

      await document.save();
    } catch (error) {
      logger.error('Error processing document content:', error);
      document.processingStatus = 'failed';
      document.vectorizationStatus = 'failed';
      document.error = error instanceof Error ? error.message : 'Unknown error during processing';
      await document.save();
      throw error;
    }
  }

  private createChunks(
    content: string,
    chunkSize: number,
    chunkOverlap: number
  ): IChunk[] {
    const chunks: IChunk[] = [];
    let index = 0;
    let position = 0;

    while (position < content.length) {
      const end = Math.min(position + chunkSize, content.length);
      const chunk = content.slice(position, end);

      chunks.push({
        content: chunk,
        index,
        metadata: {
          start: position,
          end: end
        }
      });

      position += chunkSize - chunkOverlap;
      index++;
    }

    return chunks;
  }

  async searchSimilarContent(
    query: string,
    userId: Types.ObjectId,
    limit: number = 5
  ): Promise<Array<{ chunk: IChunk; score: number; documentId: string }>> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);
      
      // TODO: Implement actual vector search once database is connected
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error searching similar content:', error);
      throw new AppError(500, 'Failed to search similar content');
    }
  }
}