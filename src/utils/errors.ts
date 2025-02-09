// src/utils/errors.ts
export class AppError extends Error {
    constructor(
      public statusCode: number,
      message: string,
      public isOperational = true
    ) {
      super(message);
      Object.setPrototypeOf(this, AppError.prototype);
    }
  }
  
  export class ValidationError extends AppError {
    constructor(message: string) {
      super(400, message);
    }
  }
  
  export class ProcessingError extends AppError {
    constructor(message: string) {
      super(500, message);
    }
  }