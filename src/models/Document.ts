// src/models/Document.ts
import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  _id: mongoose.Types.ObjectId;
  originalName: string;
  mimeType: string;
  content: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema({
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;