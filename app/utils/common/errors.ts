import { ERROR_MESSAGES } from './constants';

// Base Error Class
export class AuraError extends Error {
  public code: string;
  public status: number;
  public details: Record<string, any>;

  constructor(message: string, code: string, status: number = 500, details: Record<string, any> = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.status = status;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        name: this.name,
        code: this.code,
        message: this.message,
        status: this.status,
        details: this.details
      }
    };
  }
}

// Authentication Errors
export class UnauthorizedError extends AuraError {
  constructor(details: Record<string, any> = {}) {
    super(ERROR_MESSAGES.UNAUTHORIZED, 'UNAUTHORIZED', 401, details);
  }
}

export class ForbiddenError extends AuraError {
  constructor(details: Record<string, any> = {}) {
    super(ERROR_MESSAGES.FORBIDDEN, 'FORBIDDEN', 403, details);
  }
}

// Resource Errors
export class NotFoundError extends AuraError {
  constructor(resource: string, details: Record<string, any> = {}) {
    super(`${resource} not found`, 'NOT_FOUND', 404, details);
  }
}

// Validation Errors
export class ValidationError extends AuraError {
  constructor(details: Record<string, any> = {}) {
    super(ERROR_MESSAGES.VALIDATION_FAILED, 'VALIDATION_FAILED', 400, details);
  }
}

// Rate Limiting Errors
export class RateLimitError extends AuraError {
  constructor(details: Record<string, any> = {}) {
    super(ERROR_MESSAGES.RATE_LIMIT_EXCEEDED, 'RATE_LIMIT_EXCEEDED', 429, details);
  }
}

// Operation Errors
export class OperationError extends AuraError {
  constructor(operation: string, message: string, details: Record<string, any> = {}) {
    super(`Operation ${operation} failed: ${message}`, 'OPERATION_FAILED', 500, details);
  }
}

// File System Errors
export class FileSystemError extends AuraError {
  constructor(operation: string, path: string, details: Record<string, any> = {}) {
    super(
      `File system operation ${operation} failed for path: ${path}`,
      'FILE_SYSTEM_ERROR',
      500,
      details
    );
  }
}

// Database Errors
export class DatabaseError extends AuraError {
  constructor(operation: string, details: Record<string, any> = {}) {
    super(
      `Database operation ${operation} failed`,
      'DATABASE_ERROR',
      500,
      details
    );
  }
}

// Error Handler
export function handleError(error: Error | AuraError): AuraError {
  if (error instanceof AuraError) {
    return error;
  }

  // Convert unknown errors to AuraError
  return new AuraError(
    ERROR_MESSAGES.INTERNAL_ERROR,
    'INTERNAL_ERROR',
    500,
    { originalError: error.message }
  );
}

// Error Logger
export async function logError(error: Error | AuraError): Promise<void> {
  const errorToLog = handleError(error);
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', {
      ...errorToLog.toJSON(),
      stack: errorToLog.stack
    });
  }

  // TODO: Implement production logging (e.g., to file, monitoring service, etc.)
} 