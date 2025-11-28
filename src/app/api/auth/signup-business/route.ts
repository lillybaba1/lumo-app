import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createBusinessAccount } from '@/services/businessAccountService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      businessName,
      businessAddress,
      businessPhone,
      taxId,
      website,
    } = body;

    // Validate required fields
    if (!email || !password || !name || !businessName || !businessAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Step 1: Create auth user with Supabase
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        data: {
          name,
          phone_number: phone,
        }
      }
    });

    if (signUpError) {
      console.error('Supabase signup error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      );
    }

    // Step 2: Create business account
    const businessAccount = await createBusinessAccount(data.user.id, {
      businessName,
      contactPersonName: name,
      contactEmail: email,
      businessAddress,
      businessPhone: businessPhone || phone,
      taxId: taxId || undefined,
      website: website || undefined,
      status: 'PENDING_VERIFICATION',
    });

    if (!businessAccount) {
      console.error('Failed to create business account');
      // User is created but business account failed
      // The user can still log in but won't have business access
      return NextResponse.json(
        { error: 'Failed to create business account. Please contact support.' },
        { status: 500 }
      );
    }

    // Step 3: Create user profile with business account reference
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: data.user.id,
        email: email,
        name: name,
        phone: phone,
        role: 'BUSINESS_ACCOUNT',
        business_account_id: businessAccount.id,
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      // Continue anyway - the business account is created
    }

    return NextResponse.json({
      success: true,
      message: 'Business account created successfully',
      userId: data.user.id,
      businessAccountId: businessAccount.id,
    });

  } catch (error: any) {
    console.error('Business signup error:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
