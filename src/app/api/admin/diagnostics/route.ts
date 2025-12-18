import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

/**
 * GET /api/admin/diagnostics
 * Diagnostic endpoint to check admin authentication and Supabase configuration
 * Use this to troubleshoot upload issues
 */
export async function GET() {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    checks: {
      authentication: { status: 'unknown', details: '' },
      adminRole: { status: 'unknown', details: '' },
      supabaseConnection: { status: 'unknown', details: '' },
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

  // Check 3: Supabase Connection
  try {
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .limit(1);
    
    if (error) {
      throw error;
    }
    
    diagnostics.checks.supabaseConnection = {
      status: 'success',
      details: 'Supabase database connection is working',
    };
  } catch (error) {
    diagnostics.checks.supabaseConnection = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Supabase connection failed',
    };
    diagnostics.recommendations.push(
      'Supabase connection failed. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  // Check 4: Storage Bucket
  try {
    // Try to access a known bucket to verify storage is working
    const { data, error } = await supabaseAdmin.storage.from('products').list('', { limit: 1 });
    
    if (error) {
      throw error;
    }
    
    diagnostics.checks.storageBucket = {
      status: 'success',
      details: 'Storage bucket "products" is accessible',
    };
  } catch (error) {
    diagnostics.checks.storageBucket = {
      status: 'error',
      details: error instanceof Error ? error.message : 'Storage bucket check failed',
    };
    diagnostics.recommendations.push(
      'Could not check storage buckets. Verify Supabase service role key has storage permissions.'
    );
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

  // Add general recommendations
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
