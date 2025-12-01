import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    // SECURITY: Require admin authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

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
      console.log('Consent logs table not found, using placeholder stats');
    }

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch privacy stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy stats' },
      { status: 500 }
    );
  }
}
