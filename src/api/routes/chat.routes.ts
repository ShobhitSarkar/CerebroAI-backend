// src/api/routes/chat.routes.ts
import { Router } from 'express';
import { ChatService } from '../../services/ChatService';
import { AppError } from '../../utils/errors';
import logger from '../../utils/logger';

const router = Router();
const chatService = new ChatService();

// Send a query to chat with documents
router.post('/query', async (req, res, next) => {
  try {
    const { query, userId, conversationId } = req.body;

    if (!query) {
      throw new AppError(400, 'Query is required');
    }

    if (!userId) {
      throw new AppError(400, 'User ID is required');
    }

    const response = await chatService.processQuery(query, userId, conversationId);
    
    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    next(error);
  }
});

// Get conversation history (optional for POC)
router.get('/history/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const history = await chatService.getConversationHistory(userId);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

export default router;