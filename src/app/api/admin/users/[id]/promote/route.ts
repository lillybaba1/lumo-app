export const runtime = 'nodejs';

import 'server-only';

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';

/**
 * Protected endpoint to promote a user to admin.
 * Requires authenticated admin session.
 * Updates user role in Supabase and logs audit entry.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    // SECURITY: Require admin authentication
    const adminUser = await requireAdmin({ redirect: false });

    const userId = params.id;
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Missing user id' }, { status: 400 });
    }

    // Prevent self-promotion (though already admin)
    if (userId === adminUser.userId) {
      return NextResponse.json({
        success: false,
        message: 'Cannot modify your own admin status'
      }, { status: 400 });
    }

    const supabaseAdmin = createAdminClient();

    // Check if user exists
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (checkError || !existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Update user role to admin
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user role:', updateError);
      return NextResponse.json({
        success: false,
        message: 'Failed to update user role'
      }, { status: 500 });
    }

    // Log audit entry (optional - only if admin_actions table exists)
    try {
      await supabaseAdmin
        .from('admin_actions')
        .insert({
          action: 'promote-to-admin',
          target_user_id: userId,
          target_user_email: existingUser.email,
          performed_by: adminUser.userId,
          performed_by_email: adminUser.email,
          performed_at: new Date().toISOString(),
        });
    } catch (auditError) {
      // Audit logging is optional - don't fail if table doesn't exist
      console.warn('Failed to log audit entry (table may not exist):', auditError);
    }

    return NextResponse.json({
      success: true,
      message: `User ${existingUser.email} promoted to admin`
    });
  } catch (err: any) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({
        success: false,
        message: err.message || 'Admin authentication required'
      }, { status: err.statusCode ?? 401 });
    }

    console.error('Failed to promote user:', err);

    const errorMessage = process.env.NODE_ENV === 'development'
      ? err.message || 'Failed to promote user'
      : 'Failed to promote user. Please try again.';

    return NextResponse.json({
      success: false,
      message: errorMessage
    }, { status: 500 });
  }
}
