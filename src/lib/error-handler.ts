/**
 * Centralized error handling utilities for API routes and server actions
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

/**
 * Standard error response format
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: any;
}

/**
 * Custom application errors
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Convert an unknown error to a standard format
 */
export function normalizeError(error: unknown): {
  message: string;
  statusCode: number;
  code?: string;
  details?: any;
} {
  // Handle AppError instances
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
      details: error.details,
    };
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      statusCode: 500,
    };
  }

  // Handle unknown error types
  return {
    message: 'An unknown error occurred',
    statusCode: 500,
  };
}

/**
 * Handle errors in API routes with consistent formatting and logging
 */
export function handleApiError(error: unknown, context?: string): NextResponse<ErrorResponse> {
  const normalized = normalizeError(error);
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Log the error
  logger.error(
    `API Error${context ? ` in ${context}` : ''}`,
    error instanceof Error ? error : undefined,
    {
      statusCode: normalized.statusCode,
      code: normalized.code,
    }
  );

  // Build response
  const response: ErrorResponse = {
    error: normalized.message,
    code: normalized.code,
  };

  // Include additional details in development
  if (isDevelopment && normalized.details) {
    response.details = normalized.details;
  }

  // Include stack trace in development for non-AppError errors
  if (isDevelopment && error instanceof Error && !(error instanceof AppError)) {
    response.details = {
      ...response.details,
      stack: error.stack,
    };
  }

  return NextResponse.json(response, { status: normalized.statusCode });
}

/**
 * Wrap an async API route handler with error handling
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<Response>,
  context?: string
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleApiError(error, context);
    }
  };
}

/**
 * Validate required fields in request body
 */
export function validateRequired<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): void {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missing.push(String(field));
    }
  }

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    );
  }
}

/**
 * Validate email format
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Invalid email format');
  }
}

/**
 * Validate string length
 */
export function validateLength(
  value: string,
  field: string,
  min?: number,
  max?: number
): void {
  if (min !== undefined && value.length < min) {
    throw new ValidationError(`${field} must be at least ${min} characters`);
  }
  if (max !== undefined && value.length > max) {
    throw new ValidationError(`${field} must be at most ${max} characters`);
  }
}
