export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query, history } = body || {};

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing or invalid `query` in request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get current user to determine role
    let userRole: 'customer' | 'admin' = 'customer';
    try {
      const user = await getCurrentUser();
      if (user && user.role === 'admin') {
        userRole = 'admin';
      }
    } catch (error) {
      // User not logged in or error - default to customer
      console.log('User not authenticated, using customer role');
    }

    // Import the server-side assistant (this file runs in Node runtime)
    const { shoppingAssistant } = await import('@/ai/flows/shopping-assistant');

    const result = await shoppingAssistant({ query, history, userRole });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('API /api/assistant error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
