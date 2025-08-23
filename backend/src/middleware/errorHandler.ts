import { type Request, type Response, type NextFunction } from 'express';
import { type ApiResponse } from '../types/index.js';
import { config } from '../config/env.js';

/**
 * Custom error types for better error handling
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code as string;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error for request validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(`Validation failed: ${message}`, 400, true, 'VALIDATION_ERROR');
    if (field) {
      this.message = `Validation failed for field '${field}': ${message}`;
    }
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND');
  }
}

/**
 * Global error handling middleware
 * Provides consistent error responses and logging
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  // Determine if this is an operational error
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;

  // Log error with appropriate level
  if (isOperational) {
    console.warn(`⚠️  Operational error [${statusCode}]:`, err.message);
  } else {
    console.error('❌ Unexpected error:', err);
  }

  // Build error response
  const errorResponse: ApiResponse = {
    success: false,
    error: isOperational ? err.message : 'Internal server error',
    message: getErrorMessage(statusCode),
  };

  // Add error code if available
  if (isAppError && err.code) {
    errorResponse.data = { code: err.code };
  }

  // Add stack trace in development
  if (config.nodeEnv === 'development') {
    errorResponse.data = {
      ...errorResponse.data,
      stack: err.stack,
      originalError: err.message
    };
  }

  // Add request context in development
  if (config.nodeEnv === 'development') {
    console.log(`   Request: ${req.method} ${req.originalUrl}`);
    if (Object.keys(req.body || {}).length > 0) {
      console.log('   Body:', JSON.stringify(req.body, null, 2));
    }
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Get user-friendly error message based on status code
 */
function getErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'The request is invalid. Please check your input.';
    case 401:
      return 'Authentication required.';
    case 403:
      return 'Access denied.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return 'The request data is invalid.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'An internal server error occurred.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service temporarily unavailable.';
    default:
      return 'An error occurred while processing your request.';
  }
}

/**
 * Middleware to handle 404 errors for unknown routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Async error wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};