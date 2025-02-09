// src/api/routes/document.routes.ts
import { Router } from 'express';
import { upload } from '../../middleware/fileUpload';
import { DocumentService } from '../../services/document.service';
import logger from '../../utils/logger';
import { AppError } from '../../utils/errors';

const router = Router();
const documentService = new DocumentService();

// Upload document
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const documentId = await documentService.processDocument(req.file);
    
    res.status(200).json({
      message: 'Document uploaded successfully',
      documentId
    });
  } catch (error) {
    next(error);
  }
});

// Get document status
router.get('/:id/status', async (req, res, next) => {
  try {
    const status = await documentService.getDocumentStatus(req.params.id);
    res.json(status);
  } catch (error) {
    next(error);
  }
});

// Get document details
router.get('/:id', async (req, res, next) => {
  try {
    const document = await documentService.getDocument(req.params.id);
    res.json(document);
  } catch (error) {
    next(error);
  }
});

export default router;