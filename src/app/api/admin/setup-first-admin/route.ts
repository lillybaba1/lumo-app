import { NextRequest, NextResponse } from 'next/server';

/**
 * DISABLED: First admin setup endpoint has been disabled for security.
 *
 * This endpoint has been permanently disabled to prevent unauthorized admin creation.
 * Admin accounts can only be created through secure, authorized channels.
 *
 * To create admin users, use one of these methods:
 * 1. Server script: node scripts/promote-to-admin.mjs email@example.com
 * 2. Existing admin can promote users through the admin panel
 * 3. API endpoint: /api/admin/promote-user (requires existing admin authentication)
 */
export async function POST(request: NextRequest) {
  // SECURITY: This endpoint has been permanently disabled
  console.warn('[SECURITY] Attempt to access disabled setup-first-admin endpoint');

  return NextResponse.json(
    {
      error: 'This endpoint has been disabled for security reasons.',
      message: 'Admin accounts can only be created by existing admins or server administrators.',
      instructions: [
        'Contact your system administrator',
        'Or use server script: node scripts/promote-to-admin.mjs your-email@example.com',
      ]
    },
    { status: 403 }
  );
}

// Also disable GET requests
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'This endpoint has been disabled for security reasons.',
      message: 'Admin setup through this page is no longer available.',
    },
    { status: 403 }
  );
}
