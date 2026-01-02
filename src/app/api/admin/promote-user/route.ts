import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminPromoteUser');

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const promoteUserSchema = z.object({
  userId: z.string().uuid().optional(),
  email: z.string().email().optional(),
  role: z.enum(['admin', 'customer']),
}).refine(data => data.userId || data.email, {
  message: 'Either userId or email is required',
});

/**
 * POST /api/admin/promote-user
 * Promote or demote a user's role (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId: adminUserId } = await requireAdmin({ redirect: false });

    const body = await request.json();
    const parsed = promoteUserSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { userId, email, role } = parsed.data;

    // Find the user to promote
    let targetUser;
    if (userId) {
      // Try user_profiles first
      let result = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, name, role')
        .eq('id', userId)
        .single();

      // Fallback to users table
      if (result.error) {
        result = await supabaseAdmin
          .from('users')
          .select('id, email, name, role')
          .eq('id', userId)
          .single();
      }

      if (result.error || !result.data) {
        return NextResponse.json(
          { error: 'User not found.' },
          { status: 404 }
        );
      }
      targetUser = result.data;
    } else if (email) {
      // Try user_profiles first
      let result = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, name, role')
        .eq('email', email.toLowerCase().trim())
        .single();

      // Fallback to users table
      if (result.error) {
        result = await supabaseAdmin
          .from('users')
          .select('id, email, name, role')
          .eq('email', email.toLowerCase().trim())
          .single();
      }

      if (result.error || !result.data) {
        return NextResponse.json(
          { error: 'User not found with that email.' },
          { status: 404 }
        );
      }
      targetUser = result.data;
    }

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found.' },
        { status: 404 }
      );
    }

    // Prevent self-demotion from admin
    if (targetUser.id === adminUserId && role === 'customer') {
      return NextResponse.json(
        { error: 'You cannot demote yourself from admin.' },
        { status: 403 }
      );
    }

    // Update the user's role in both tables for consistency
    // Try user_profiles first
    let updateResult = await supabaseAdmin
      .from('user_profiles')
      .update({ role })
      .eq('id', targetUser.id);

    // If user_profiles doesn't exist, try users table
    if (updateResult.error) {
      updateResult = await supabaseAdmin
        .from('users')
        .update({ role })
        .eq('id', targetUser.id);
    }

    if (updateResult.error) {
      apiLogger.error('Failed to update user role', updateResult.error);
      return NextResponse.json(
        { error: 'Failed to update user role.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `User ${targetUser.email} has been ${role === 'admin' ? 'promoted to admin' : 'demoted to customer'}.`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        previousRole: targetUser.role,
        newRole: role,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Error promoting user', error as Error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
