import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * API Route: Promote or Revoke Admin Role
 * POST /api/admin/manage-role
 * 
 * Requires: Admin authentication
 * Body: { email: string, action: 'promote' | 'revoke' }
 */

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Check if current user is an admin
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || currentUserProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { email, action } = body;

    if (!email || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: email and action' },
        { status: 400 }
      );
    }

    if (!['promote', 'revoke'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "promote" or "revoke"' },
        { status: 400 }
      );
    }

    // Find target user
    const { data: targetUser, error: targetError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .single();

    if (targetError) {
      if (targetError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      throw targetError;
    }

    // Prevent demoting yourself
    if (action === 'revoke' && targetUser.id === user.id) {
      return NextResponse.json(
        { error: 'Cannot revoke your own admin privileges' },
        { status: 400 }
      );
    }

    // Check current role
    if (action === 'promote' && targetUser.role === 'admin') {
      return NextResponse.json(
        { message: 'User is already an admin', user: targetUser },
        { status: 200 }
      );
    }

    if (action === 'revoke' && targetUser.role !== 'admin') {
      return NextResponse.json(
        { message: 'User is not an admin', user: targetUser },
        { status: 200 }
      );
    }

    // Update role
    const newRole = action === 'promote' ? 'admin' : 'user';
    const { error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        role: newRole,
        updated_at: new Date().toISOString()
      })
      .eq('id', targetUser.id);

    if (updateError) {
      throw updateError;
    }

    // Log the action
    console.log(`Admin action: ${user.email} ${action}d ${email} to/from admin role`);

    return NextResponse.json({
      success: true,
      message: `Successfully ${action}d ${email} ${action === 'promote' ? 'to' : 'from'} admin role`,
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: newRole
      }
    });

  } catch (error: any) {
    console.error('Admin role management error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/manage-role
 * List all admins
 */
export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify the user is authenticated and is an admin
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      );
    }

    // Check if current user is an admin
    const { data: currentUserProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || currentUserProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Get all admins
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, name, created_at, updated_at')
      .eq('role', 'admin')
      .order('created_at', { ascending: true });

    if (adminsError) {
      throw adminsError;
    }

    return NextResponse.json({
      admins: admins || [],
      count: admins?.length || 0
    });

  } catch (error: any) {
    console.error('List admins error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
