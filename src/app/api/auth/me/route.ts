import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';

export const runtime = 'nodejs';

/**
 * GET /api/auth/me
 * Returns the current authenticated user's information
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }
}
