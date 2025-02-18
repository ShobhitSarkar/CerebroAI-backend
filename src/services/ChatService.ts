// src/services/ChatService.ts
import { Types } from 'mongoose';
import { AIDocumentProcessor } from './AIDocumentProcessor';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

interface ChatResponse {
  answer: string;
  citations: Array<{
    content: string;
    documentId: string;
    score: number;
  }>;
  conversationId?: string;
}

export class ChatService {
  private aiProcessor: AIDocumentProcessor;

  constructor() {
    this.aiProcessor = new AIDocumentProcessor();
  }

  async processQuery(
    query: string,
    userId: string,
    conversationId?: string
  ): Promise<ChatResponse> {
    try {
      logger.info(`Processing query for user ${userId}`);
      
      // Convert userId to ObjectId
      const userObjectId = new Types.ObjectId(userId);

      // Search for relevant content in user's documents
      const similarContent = await this.aiProcessor.searchSimilarContent(
        query,
        userObjectId
      );

      // For POC, we'll return a simple response with citations
      // TODO: Integrate with actual LLM for proper response generation
      return {
        answer: `This is a mock response to your query: "${query}"`,
        citations: similarContent.map(content => ({
          content: content.chunk.content,
          documentId: content.documentId,
          score: content.score
        })),
        conversationId: conversationId || new Types.ObjectId().toString()
      };
    } catch (error) {
      logger.error('Error processing chat query:', error);
      throw new AppError(500, 'Failed to process query');
    }
  }

  async getConversationHistory(userId: string): Promise<any[]> {
    try {
      // TODO: Implement conversation history retrieval
      // For POC, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting conversation history:', error);
      throw new AppError(500, 'Failed to get conversation history');
    }
  }
}

export default ChatService;