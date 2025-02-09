// src/middleware/fileUpload.ts
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '../utils/errors';
import config from '../config';

// Allowed file types
const ALLOWED_FILE_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
    cb(new AppError(400, 'Invalid file type. Only PDF and DOC files are allowed.'));
    return;
  }
  cb(null, true);
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB limit
  }
});

// File validation middleware
export const validateFile = (req: Request, file: Express.Multer.File) => {
  // Additional file validation if needed
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > 5) {
    throw new AppError(400, 'File size exceeds 5MB limit');
  }

  // Virus scan simulation (in production, implement actual virus scanning)
  if (process.env.NODE_ENV === 'production') {
    // Implement virus scanning logic here
    console.log('Virus scan would be performed here in production');
  }

  return true;
};