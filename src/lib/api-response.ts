/**
 * Standardized API response utilities
 * Provides consistent response format across all API routes
 */

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { logger } from './logger';

const apiLogger = logger.child('API');

/**
 * Standard success response format
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
  };
}

/**
 * Standard error response format
 */
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Create a success response
 */
export function success<T>(
  data: T, 
  status: number = 200,
  meta?: SuccessResponse['meta']
): NextResponse<SuccessResponse<T>> {
  const response: SuccessResponse<T> = { success: true, data };
  if (meta) {
    response.meta = meta;
  }
  return NextResponse.json(response, { status });
}

/**
 * Create a paginated success response
 */
export function paginated<T>(
  data: T[],
  total: number,
  page: number = 1,
  limit: number = 20
): NextResponse<SuccessResponse<T[]>> {
  return success(data, 200, {
    page,
    limit,
    total,
    hasMore: page * limit < total,
  });
}

/**
 * Create an error response
 */
export function error(
  message: string,
  code: string = 'INTERNAL_ERROR',
  status: number = 500,
  details?: unknown
): NextResponse<ErrorResponse> {
  apiLogger.error(`API Error: ${code}`, undefined, { message, details });
  
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && process.env.NODE_ENV === 'development' ? { details } : {}),
      },
    },
    { status }
  );
}

/**
 * Common error responses
 */
export const errors = {
  badRequest: (message: string = 'Bad request', details?: unknown) =>
    error(message, 'BAD_REQUEST', 400, details),

  unauthorized: (message: string = 'Authentication required') =>
    error(message, 'UNAUTHORIZED', 401),

  forbidden: (message: string = 'Insufficient permissions') =>
    error(message, 'FORBIDDEN', 403),

  notFound: (resource: string = 'Resource') =>
    error(`${resource} not found`, 'NOT_FOUND', 404),

  conflict: (message: string = 'Resource already exists') =>
    error(message, 'CONFLICT', 409),

  validationError: (zodError: ZodError) =>
    error(
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      zodError.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
    ),

  rateLimited: (retryAfter?: number) => {
    const response = error('Too many requests', 'RATE_LIMITED', 429);
    if (retryAfter) {
      response.headers.set('Retry-After', String(retryAfter));
    }
    return response;
  },

  serverError: (message: string = 'Internal server error', details?: unknown) =>
    error(message, 'INTERNAL_ERROR', 500, details),
};

/**
 * Wrap an async handler with error handling
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ErrorResponse>> {
  return handler().catch((err) => {
    if (err instanceof ZodError) {
      return errors.validationError(err) as NextResponse<ErrorResponse>;
    }
    
    apiLogger.error('Unhandled API error', err);
    return errors.serverError() as NextResponse<ErrorResponse>;
  });
}
