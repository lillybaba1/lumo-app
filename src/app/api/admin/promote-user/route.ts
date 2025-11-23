import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface PromoteUserRequest {
  userId?: string;
  email?: string;
  role: 'admin' | 'customer';
}

/**
 * POST /api/admin/promote-user
 * Promote or demote a user's role (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if requester is authenticated and is an admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Get requester's profile to check admin status
    // Try user_profiles first (new Supabase system)
    let requesterProfile = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Fallback to users table if not found in user_profiles
    if (requesterProfile.error) {
      requesterProfile = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
    }

    if (!requesterProfile.data || requesterProfile.data.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Only admins can promote users.' },
        { status: 403 }
      );
    }

    const body: PromoteUserRequest = await request.json();
    const { userId, email, role } = body;

    // Validate inputs
    if (!userId && !email) {
      return NextResponse.json(
        { error: 'Either userId or email is required.' },
        { status: 400 }
      );
    }

    if (!role || !['admin', 'customer'].includes(role)) {
      return NextResponse.json(
        { error: 'Role must be either "admin" or "customer".' },
        { status: 400 }
      );
    }

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
    if (targetUser.id === user.id && role === 'customer' && requesterProfile.data.role === 'admin') {
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
      console.error('Failed to update user role:', updateResult.error);
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
  } catch (error: any) {
    console.error('Error promoting user:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 }
    );
  }
}
