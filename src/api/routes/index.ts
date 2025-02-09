// src/api/routes/index.ts
import { Router } from 'express';
import { apiLimiter } from '../../middleware/rateLimiter';
import documentRoutes from './document.routes';
import flashcardRoutes from '../routes/flashcards.routes';
import mongoose from 'mongoose';

const router = Router();

router.use(apiLimiter);

// Test endpoint to verify MongoDB connection
router.post('/test', async (req, res) => {
  try {
    // Create a temporary collection
    const TestModel = mongoose.model('Test', new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    }));

    // Create a test document
    const testDoc = await TestModel.create({
      message: 'Test connection successful!'
    });

    res.json({
      success: true,
      data: testDoc,
      message: 'MongoDB connection is working!'
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({
      success: false,
      error: error.message || 'An unknown error occurred'
    });
  }
});

router.use('/documents', documentRoutes);
router.use('/flashcards', flashcardRoutes);

export default router;