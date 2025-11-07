import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';
import { isFirebaseAdminInitialized, bucket } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

/**
 * GET /api/admin/diagnostics
 * Diagnostic endpoint to check admin authentication and Firebase configuration
 * Use this to troubleshoot upload issues
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {
      authentication: { status: 'unknown', details: '' },
      adminRole: { status: 'unknown', details: '' },
      firebaseAdmin: { status: 'unknown', details: '' },
      storageBucket: { status: 'unknown', details: '' },
    },
    summary: '',
    recommendations: [] as string[],
  };

  // Check 1: Authentication
  try {
    const user = await getCurrentUser();
    if (user) {
      diagnostics.checks.authentication = {
        status: 'success',
        details: `Authenticated as ${user.email} (${user.userId})`,
      };

      // Check 2: Admin Role
      if (user.role === 'admin') {
        diagnostics.checks.adminRole = {
          status: 'success',
          details: `User has admin role`,
        };
      } else {
        diagnostics.checks.adminRole = {
          status: 'error',
          details: `User role is "${user.role}", not "admin"`,
        };
        diagnostics.recommendations.push(
          'Your account does not have admin privileges. Go to /admin/setup-first-admin if no admin exists, or ask an existing admin to promote your account.'
        );
      }
    } else {
      diagnostics.checks.authentication = {
        status: 'error',
        details: 'Not authenticated',
      };
      diagnostics.checks.adminRole = {
        status: 'error',
        details: 'Cannot check role - not authenticated',
      };
      diagnostics.recommendations.push(
        'You are not logged in. Please login at /admin/login or signup at /signup.'
      );
    }
  } catch (error) {
    diagnostics.checks.authentication = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Authentication check failed',
    };
    diagnostics.checks.adminRole = {
      status: 'error',
      details: 'Cannot check role - authentication failed',
    };
  }

  // Check 3: Firebase Admin SDK
  try {
    const adminInitialized = isFirebaseAdminInitialized();
    if (adminInitialized) {
      diagnostics.checks.firebaseAdmin = {
        status: 'success',
        details: 'Firebase Admin SDK is initialized',
      };
    } else {
      diagnostics.checks.firebaseAdmin = {
        status: 'error',
        details: 'Firebase Admin SDK is not initialized',
      };
      diagnostics.recommendations.push(
        'Firebase Admin SDK is not initialized. Set SERVICE_ACCOUNT_JSON or SERVICE_ACCOUNT_BASE64 environment variable with your service account credentials.'
      );
    }
  } catch (error) {
    diagnostics.checks.firebaseAdmin = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Firebase Admin check failed',
    };
  }

  // Check 4: Storage Bucket
  try {
    const bucketInstance = bucket();
    if (bucketInstance && bucketInstance.name) {
      diagnostics.checks.storageBucket = {
        status: 'success',
        details: `Storage bucket configured: ${bucketInstance.name}`,
      };
    } else {
      diagnostics.checks.storageBucket = {
        status: 'error',
        details: 'Storage bucket is not configured',
      };
      diagnostics.recommendations.push(
        'Firebase Storage bucket is not configured. Set STORAGE_BUCKET environment variable.'
      );
    }
  } catch (error) {
    diagnostics.checks.storageBucket = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Storage bucket check failed',
    };
    if (error instanceof Error && error.message.includes('credentials')) {
      diagnostics.recommendations.push(
        'Firebase Admin credentials are missing or invalid. Check SERVICE_ACCOUNT_JSON environment variable.'
      );
    }
  }

  // Generate summary
  const allChecks = Object.values(diagnostics.checks);
  const successCount = allChecks.filter((c) => c.status === 'success').length;
  const errorCount = allChecks.filter((c) => c.status === 'error').length;

  if (errorCount === 0) {
    diagnostics.summary = '✅ All checks passed! Image upload should work.';
  } else if (successCount === 0) {
    diagnostics.summary = '❌ All checks failed. Please follow the recommendations below.';
  } else {
    diagnostics.summary = `⚠️ ${errorCount} check(s) failed. Image upload may not work.`;
  }

  // Add general recommendations if there are errors
  if (errorCount > 0) {
    diagnostics.recommendations.push(
      'See UPLOAD_TROUBLESHOOTING.md for detailed setup instructions.',
      'Check your browser console and Network tab for more details.',
      'Ensure all environment variables are set in your deployment platform (Vercel/Netlify).'
    );
  }

  return NextResponse.json(diagnostics, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
