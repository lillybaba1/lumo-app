import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

/**
 * One-time endpoint to create the first admin user.
 * Should be disabled or removed after first admin is created.
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createAdminClient();

    // Check if any admin users exist
    const { data: existingAdmins, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Error checking for existing admins:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing users' },
        { status: 500 }
      );
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json(
        { error: 'An admin user already exists. This endpoint can only create the first admin.' },
        { status: 403 }
      );
    }

    const { email, password, name } = await request.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, password, and name are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: name,
      },
    });

    if (authError || !authData.user) {
      console.error('Error creating user:', authError);
      let errorMessage = 'Failed to create user';

      if (authError?.message.includes('already registered')) {
        errorMessage = 'An account with this email already exists';
      } else if (authError?.message.includes('invalid')) {
        errorMessage = 'Invalid email address or password';
      } else if (authError?.message) {
        errorMessage = authError.message;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // Create user record in users table with admin role
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        name: name,
        role: 'admin',
        created_at: new Date().toISOString(),
      });

    if (insertError) {
      console.error('Error inserting user record:', insertError);
      // Try to clean up the auth user if insert failed
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: 'Failed to create user record: ' + insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'First admin user created successfully',
      data: {
        id: authData.user.id,
        email: authData.user.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Error creating first admin:', error);

    return NextResponse.json(
      { error: error.message || 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
