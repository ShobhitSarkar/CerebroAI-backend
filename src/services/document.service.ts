// src/services/document.service.ts
import { promises as fs } from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import { Types } from 'mongoose';
import Document, { IDocument } from '../models/Document';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export class DocumentService {
  async processDocument(file: Express.Multer.File): Promise<string> {
    try {
      let content: string;

      // Extract text based on file type
      if (file.mimetype === 'application/pdf') {
        content = await this.extractPdfContent(file.path);
      } else if (
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        content = await this.extractDocContent(file.path);
      } else {
        throw new AppError(400, 'Unsupported file type');
      }

      // Create document in database
      const document = await Document.create({
        originalName: file.originalname,
        mimeType: file.mimetype,
        content,
        processingStatus: 'pending',
        chunks: [], // Add default empty array for chunks
        vectorizationStatus: 'pending' // Add default vectorization status
      }) as IDocument;

      // Clean up uploaded file
      await fs.unlink(file.path);

      return document._id.toString();
    } catch (error) {
      logger.error('Error processing document:', error);
      throw new AppError(500, 'Failed to process document');
    }
  }

  private async extractPdfContent(filePath: string): Promise<string> {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const pdfData = await pdf(dataBuffer);
      return pdfData.text;
    } catch (error) {
      logger.error('Error extracting PDF content:', error);
      throw new AppError(500, 'Failed to extract PDF content');
    }
  }

  private async extractDocContent(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error('Error extracting DOC content:', error);
      throw new AppError(500, 'Failed to extract DOC content');
    }
  }

  async getDocument(id: string): Promise<IDocument> {
    const document = await Document.findById(id) as IDocument | null;
    if (!document) {
      throw new AppError(404, 'Document not found');
    }
    return document;
  }

  async getDocumentStatus(id: string): Promise<{ status: string; error?: string }> {
    const document = await Document.findById(id, 'processingStatus error') as IDocument | null;
    if (!document) {
      throw new AppError(404, 'Document not found');
    }
    return {
      status: document.processingStatus,
      error: document.error
    };
  }
}