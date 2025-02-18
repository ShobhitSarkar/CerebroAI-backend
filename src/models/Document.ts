// src/models/Document.ts
import mongoose, { Schema, Document as MongoDocument } from 'mongoose';

export interface IChunk {
  content: string;
  index: number;
  embedding?: number[];
  metadata?: {
    start: number;
    end: number;
    [key: string]: any;
  };
}

interface IDocumentBase {
  userId: mongoose.Types.ObjectId;
  originalName: string;
  mimeType: string;
  content: string;
  chunks: IChunk[];
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  vectorizationStatus: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  metadata?: {
    totalChunks: number;
    wordCount: number;
    lastProcessed: Date;
    [key: string]: any;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface IDocument extends IDocumentBase, MongoDocument {
  _id: mongoose.Types.ObjectId;
}

const chunkSchema = new Schema({
  content: {
    type: String,
    required: true
  },
  index: {
    type: Number,
    required: true
  },
  embedding: {
    type: [Number],
    sparse: true,
    index: {
      name: 'vectorIndex',
      type: 'vectorSearch'
    }
  },
  metadata: {
    start: Number,
    end: Number,
    type: Map,
    of: Schema.Types.Mixed
  }
});

const documentSchema = new Schema<IDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
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
  chunks: [chunkSchema],
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  vectorizationStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: {
    type: String
  },
  metadata: {
    totalChunks: Number,
    wordCount: Number,
    lastProcessed: Date,
    type: Map,
    of: Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Create indexes
documentSchema.index({ userId: 1, createdAt: -1 });
documentSchema.index({ processingStatus: 1 });
documentSchema.index({ vectorizationStatus: 1 });

const DocumentModel = mongoose.model<IDocument>('Document', documentSchema);

export default DocumentModel;