import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, authAdmin, isFirebaseAdminInitialized } from '@/lib/firebaseAdmin';

/**
 * One-time endpoint to create the first admin user.
 * Should be disabled or removed after first admin is created.
 */
export async function POST(request: NextRequest) {
  if (!isFirebaseAdminInitialized()) {
    return NextResponse.json(
      { error: 'Firebase Admin not initialized' },
      { status: 500 }
    );
  }

  try {
    // Check if any users exist
    const usersSnapshot = await dbAdmin().collection('users').limit(1).get();
    
    if (!usersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Users already exist. This endpoint can only create the first admin.' },
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

    // Create the first user with admin role
    const userRecord = await authAdmin().createUser({
      email,
      password,
      displayName: name,
    });

    await dbAdmin().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      name: name,
      createdAt: new Date().toISOString(),
      role: 'admin',
    });

    return NextResponse.json({
      success: true,
      message: 'First admin user created successfully',
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'admin',
      },
    });
  } catch (error: any) {
    console.error('Error creating first admin:', error);

    let errorMessage = 'An unknown error occurred';
    
    if (error.code === 'auth/email-already-exists') {
      errorMessage = 'An account with this email already exists';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
