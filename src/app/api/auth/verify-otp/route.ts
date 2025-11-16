import { NextRequest, NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/otp-service';
import { getClientIdentifier } from '@/lib/rate-limiter';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface VerifyOTPRequest {
  phone: string;
  code: string;
}

/**
 * POST /api/auth/verify-otp
 * Verify SMS OTP code and create authenticated session
 * Uses admin client to bypass RLS policies
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const body: VerifyOTPRequest = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: 'Phone number and verification code are required.' },
        { status: 400 }
      );
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Verification code must be 6 digits.' },
        { status: 400 }
      );
    }

    // First verify the OTP code using custom verification system
    const result = await verifyOTP(phone, code, clientId);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          remainingAttempts: result.remainingAttempts,
          retryAfter: result.retryAfter,
        },
        { status: 400 }
      );
    }

    // OTP verified successfully - now create an authenticated session
    const supabase = await createClient();

    // Use admin client to bypass RLS and get the user from the database
    let { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, email, name')
      .eq('phone_number', phone)
      .single();

    if (userError || !userData) {
      console.error('User not found in users table:', userError);

      // Try to get the user from Supabase Auth instead
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.error('Failed to list auth users:', authError);
        return NextResponse.json(
          { error: 'User not found. Please sign up again.' },
          { status: 404 }
        );
      }

      // Find user by phone in auth
      const authUser = authUsers.users.find(u => u.phone === phone);

      if (!authUser) {
        return NextResponse.json(
          { error: 'User not found. Please sign up again.' },
          { status: 404 }
        );
      }

      // Create the missing profile in users table
      const { error: createError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || 'User',
          phone_number: phone,
          role: 'customer',
          email_verified: authUser.email_confirmed_at ? true : false,
          phone_verified: false,
        });

      if (createError) {
        console.error('Failed to create user profile:', createError);
        return NextResponse.json(
          { error: 'Failed to create user profile. Please contact support.' },
          { status: 500 }
        );
      }

      // Re-fetch the user data
      const { data: newUserData, error: newUserError } = await supabaseAdmin
        .from('users')
        .select('id, email, name')
        .eq('phone_number', phone)
        .single();

      if (newUserError || !newUserData) {
        return NextResponse.json(
          { error: 'Failed to retrieve user data. Please contact support.' },
          { status: 500 }
        );
      }

      // Use the newly created user data
      userData = newUserData;
    }

    // Update phone verification status in database using admin client
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .update({ phone_verified: true })
      .eq('phone_number', phone);

    if (updateError) {
      console.error('Failed to update phone verification status:', updateError);
    }

    // Use admin client to update user's phone confirmation in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      userData.id,
      { phone_confirm: true }
    );

    if (authError) {
      console.error('Failed to confirm phone in Supabase Auth:', authError);
    }

    // Generate a session for the user using admin API
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userData.email,
    });

    if (sessionError || !sessionData) {
      console.error('Failed to generate session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to create session. Please try logging in with your email and password.' },
        { status: 500 }
      );
    }

    // Extract the hashed token from the magic link
    const url = new URL(sessionData.properties.action_link);
    const token = url.searchParams.get('token');
    const tokenHash = url.searchParams.get('token_hash');
    const type = url.searchParams.get('type');

    if (!token || !tokenHash || !type) {
      console.error('Invalid magic link generated');
      return NextResponse.json(
        { error: 'Failed to create session. Please try logging in with your email and password.' },
        { status: 500 }
      );
    }

    // Verify the OTP token to create a session
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'magiclink',
    });

    if (verifyError || !verifyData.session) {
      console.error('Failed to verify magic link token:', verifyError);
      return NextResponse.json(
        { error: 'Failed to create session. Please try logging in with your email and password.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number verified successfully! You are now logged in.',
      user: verifyData.user,
    });
  } catch (error: any) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred during verification.' },
      { status: 500 }
    );
  }
}
