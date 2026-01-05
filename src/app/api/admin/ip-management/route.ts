import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { 
  investigateIP, 
  banIP, 
  unbanIP, 
  getBannedIPs, 
  isIPBanned,
  getSuspiciousActivities,
  resolveSuspiciousActivity,
  getIPInvestigations,
  // User-IP tracking functions
  getUsersByIP,
  getIPsByUser,
  getUserLoginHistory,
  getFlaggedUsers,
  getMultiAccountIPs,
  flagUser,
  unflagUser,
  setUserIPBlocked,
  setUserIPTrusted,
  getUserSecuritySummary,
} from '@/services/ipService';

// Helper to verify admin
async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Unauthorized', status: 401 };
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (!profile || !['admin', 'superadmin'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }

  return { user, profile };
}

// GET - Get IP info, banned IPs, suspicious activities, or investigate an IP
export async function GET(request: Request) {
  try {
    const auth = await verifyAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const ip = searchParams.get('ip');

    // Investigate a specific IP
    if (action === 'investigate' && ip) {
      const investigation = await investigateIP(ip, auth.user.id);
      return NextResponse.json({ success: true, data: investigation });
    }

    // Check if IP is banned
    if (action === 'check-ban' && ip) {
      const banStatus = await isIPBanned(ip);
      return NextResponse.json({ success: true, data: banStatus });
    }

    // Get all banned IPs
    if (action === 'banned') {
      const includeInactive = searchParams.get('includeInactive') === 'true';
      const bannedIPs = await getBannedIPs(includeInactive);
      return NextResponse.json({ success: true, data: bannedIPs });
    }

    // Get suspicious activities
    if (action === 'suspicious') {
      const unresolvedOnly = searchParams.get('unresolvedOnly') !== 'false';
      const severity = searchParams.get('severity') || undefined;
      const activities = await getSuspiciousActivities({ unresolvedOnly, severity });
      return NextResponse.json({ success: true, data: activities });
    }

    // Get IP investigation history
    if (action === 'investigations') {
      const investigations = await getIPInvestigations(ip || undefined, 100);
      return NextResponse.json({ success: true, data: investigations });
    }

    // Get users who have used a specific IP
    if (action === 'users-by-ip' && ip) {
      const users = await getUsersByIP(ip);
      return NextResponse.json({ success: true, data: users });
    }

    // Get IPs used by a specific user
    if (action === 'ips-by-user') {
      const userId = searchParams.get('userId');
      if (!userId) {
        return NextResponse.json({ error: 'userId required' }, { status: 400 });
      }
      const ips = await getIPsByUser(userId);
      return NextResponse.json({ success: true, data: ips });
    }

    // Get user login history
    if (action === 'login-history') {
      const userId = searchParams.get('userId') || undefined;
      const email = searchParams.get('email') || undefined;
      const limit = parseInt(searchParams.get('limit') || '100');
      const history = await getUserLoginHistory(userId, email, ip || undefined, limit);
      return NextResponse.json({ success: true, data: history });
    }

    // Get flagged users
    if (action === 'flagged-users') {
      const flaggedOnly = searchParams.get('flaggedOnly') === 'true';
      const minRiskScore = parseInt(searchParams.get('minRiskScore') || '0');
      const users = await getFlaggedUsers({ flaggedOnly, minRiskScore });
      return NextResponse.json({ success: true, data: users });
    }

    // Get IPs used by multiple accounts
    if (action === 'multi-account-ips') {
      const minAccounts = parseInt(searchParams.get('minAccounts') || '2');
      const ips = await getMultiAccountIPs(minAccounts);
      return NextResponse.json({ success: true, data: ips });
    }

    // Get security summary for a user
    if (action === 'user-security') {
      const email = searchParams.get('email');
      if (!email) {
        return NextResponse.json({ error: 'email required' }, { status: 400 });
      }
      const summary = await getUserSecuritySummary(email);
      return NextResponse.json({ success: true, data: summary });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('IP Management GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Ban IP, unban IP, or resolve suspicious activity
export async function POST(request: Request) {
  try {
    const auth = await verifyAdmin();
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    const { action, ip, reason, expiresAt, banType, notes, ipRange, activityId, resolutionNotes } = body;

    // Ban an IP
    if (action === 'ban' && ip) {
      const ban = await banIP(ip, reason || 'No reason provided', auth.user.id, {
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
        banType: banType || 'manual',
        notes,
        ipRange,
      });

      if (!ban) {
        return NextResponse.json({ error: 'Failed to ban IP' }, { status: 500 });
      }

      return NextResponse.json({ success: true, data: ban });
    }

    // Unban an IP
    if (action === 'unban' && ip) {
      const success = await unbanIP(ip, auth.user.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to unban IP' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Resolve suspicious activity
    if (action === 'resolve' && activityId) {
      const success = await resolveSuspiciousActivity(activityId, auth.user.id, resolutionNotes || '');
      if (!success) {
        return NextResponse.json({ error: 'Failed to resolve activity' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Flag a user
    if (action === 'flag-user') {
      const { email, flagReason } = body;
      if (!email) {
        return NextResponse.json({ error: 'email required' }, { status: 400 });
      }
      const success = await flagUser(email, auth.user.id, flagReason);
      if (!success) {
        return NextResponse.json({ error: 'Failed to flag user' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Unflag a user
    if (action === 'unflag-user') {
      const { email } = body;
      if (!email) {
        return NextResponse.json({ error: 'email required' }, { status: 400 });
      }
      const success = await unflagUser(email);
      if (!success) {
        return NextResponse.json({ error: 'Failed to unflag user' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Block/unblock IP for a specific user
    if (action === 'block-user-ip') {
      const { userId, blocked } = body;
      if (!userId || !ip) {
        return NextResponse.json({ error: 'userId and ip required' }, { status: 400 });
      }
      const success = await setUserIPBlocked(userId, ip, blocked !== false);
      if (!success) {
        return NextResponse.json({ error: 'Failed to update IP block status' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    // Trust/untrust IP for a specific user
    if (action === 'trust-user-ip') {
      const { userId, trusted } = body;
      if (!userId || !ip) {
        return NextResponse.json({ error: 'userId and ip required' }, { status: 400 });
      }
      const success = await setUserIPTrusted(userId, ip, trusted !== false);
      if (!success) {
        return NextResponse.json({ error: 'Failed to update IP trust status' }, { status: 500 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('IP Management POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
