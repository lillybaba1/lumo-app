export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';
import { getClientIdentifier, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AI Assistant API');

export async function POST(req: Request) {
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req);
    const rateLimit = checkRateLimit(clientId, RATE_LIMITS.AI_ASSISTANT);

    if (rateLimit.limited) {
      logger.warn('Rate limit exceeded', { clientId, resetTime: rateLimit.resetTime });
      return new Response(
        JSON.stringify({
          error: 'Too many requests. Please try again later.',
          resetTime: rateLimit.resetTime,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            ...rateLimit.headers,
          },
        }
      );
    }

    const body = await req.json();
    const { query, history } = body || {};

    if (!query || typeof query !== 'string') {
      logger.warn('Invalid request: missing query');
      return new Response(JSON.stringify({ error: 'Missing or invalid `query` in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user to determine role
    let userRole: 'customer' | 'admin' = 'customer';
    let userId: string | undefined;

    try {
      const user = await getCurrentUser();
      if (user) {
        userId = user.userId;
        if (user.role === 'admin') {
          userRole = 'admin';
          logger.debug('Admin user detected', { userId });
        }
      }
    } catch (error) {
      // User not logged in or error - default to customer
      logger.debug('User not authenticated, defaulting to customer');
    }

    logger.info('Processing AI request', {
      userRole,
      userId,
      queryLength: query.length,
      historyLength: history?.length || 0,
    });

    // Import the server-side assistant (this file runs in Node runtime)
    const { shoppingAssistant } = await import('@/ai/flows/shopping-assistant');

    const result = await shoppingAssistant({ query, history, userRole });

    logger.info('AI request completed', {
      userId,
      answerLength: result.answer?.length || 0,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimit.headers,
      },
    });
  } catch (err: any) {
    logger.error('AI assistant error', err);

    // In production, provide a sanitized error message that helps debugging
    // without exposing sensitive internal details to end users
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment
      ? err?.message || 'Internal server error'
      : 'AI service is currently unavailable. Please try again later.';

    // Always log detailed error for debugging
    console.error('[AI Assistant] Error details:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
      cause: err?.cause,
    });

    return new Response(JSON.stringify({
      error: errorMessage,
      // Include error type for debugging (safe to expose)
      errorType: err?.name || 'UnknownError'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
