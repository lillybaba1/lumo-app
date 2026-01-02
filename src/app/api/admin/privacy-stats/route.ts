import { NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminPrivacyStats');

export async function GET() {
  try {
    await requireAdmin({ redirect: false });

    // Get privacy consent stats from database
    // For now, return placeholder data since we're storing consent client-side
    // In production, you'd track this server-side with a consent_logs table
    
    const stats = {
      totalVisitors: 0,
      cookieConsents: {
        accepted: 0,
        declined: 0,
        pending: 0,
      },
      locationConsents: {
        granted: 0,
        denied: 0,
        pending: 0,
      },
      cookieBreakdown: {
        analytics: 0,
        marketing: 0,
        preferences: 0,
      },
    };

    // Try to get actual stats if consent_logs table exists
    try {
      const { data: consentLogs, error } = await supabaseAdmin
        .from('consent_logs')
        .select('*');

      if (!error && consentLogs) {
        stats.totalVisitors = consentLogs.length;
        
        consentLogs.forEach((log: any) => {
          // Cookie consents
          if (log.cookie_consent === 'all') {
            stats.cookieConsents.accepted++;
            stats.cookieBreakdown.analytics++;
            stats.cookieBreakdown.marketing++;
            stats.cookieBreakdown.preferences++;
          } else if (log.cookie_consent === 'necessary') {
            stats.cookieConsents.declined++;
          } else {
            stats.cookieConsents.pending++;
          }

          // Location consents
          if (log.location_consent === 'granted') {
            stats.locationConsents.granted++;
          } else if (log.location_consent === 'denied') {
            stats.locationConsents.denied++;
          } else {
            stats.locationConsents.pending++;
          }

          // Individual cookie preferences
          if (log.analytics_enabled) stats.cookieBreakdown.analytics++;
          if (log.marketing_enabled) stats.cookieBreakdown.marketing++;
          if (log.preferences_enabled) stats.cookieBreakdown.preferences++;
        });
      }
    } catch (e) {
      // Table doesn't exist yet, use placeholder stats
      apiLogger.debug('Consent logs table not found, using placeholder stats');
    }

    return NextResponse.json(stats);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Failed to fetch privacy stats', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy stats' },
      { status: 500 }
    );
  }
}
