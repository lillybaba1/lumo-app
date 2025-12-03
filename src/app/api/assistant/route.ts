export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getClientIdentifier, checkRateLimit, RATE_LIMITS } from '@/lib/rate-limiter';
import { createLogger } from '@/lib/logger';

const logger = createLogger('AI Assistant API');

// ==========================================
// CUSTOMER SHOPPING ASSISTANT API
// ==========================================
// This is the PUBLIC shopping assistant for customers.
// It ONLY has access to product information.
// Admins use /api/admin/ai-assistant instead.

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

    // Log request (customer only - no admin detection needed)
    console.log('[Shopping AI] Customer query:', {
      queryPreview: query.substring(0, 50),
    });

    logger.info('Processing shopping AI request', {
      queryLength: query.length,
      historyLength: history?.length || 0,
    });

    // Import the customer shopping assistant
    const { shoppingAssistant } = await import('@/ai/flows/shopping-assistant');

    // Customer-only - no admin features
    const result = await shoppingAssistant({ query, history });

    logger.info('Shopping AI request completed', {
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
    logger.error('Shopping AI error', err);

    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = isDevelopment
      ? err?.message || 'Internal server error'
      : 'AI service is currently unavailable. Please try again later.';

    console.error('[Shopping AI] Error details:', {
      message: err?.message,
      name: err?.name,
      stack: err?.stack,
    });

    return new Response(JSON.stringify({
      error: errorMessage,
      errorType: err?.name || 'UnknownError'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
