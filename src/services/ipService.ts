"use server";

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const ipLogger = logger.child('IPService');

export interface IPInvestigation {
  ip: string;
  // Location
  country: string;
  country_code: string;
  city: string;
  region: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  // Network
  isp: string | null;
  org: string | null;
  asn: string | null;
  // Security
  is_vpn: boolean;
  is_proxy: boolean;
  is_tor: boolean;
  is_datacenter: boolean;
  is_mobile: boolean;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  threat_types: string[];
  // Detection
  real_ip: string | null;
  real_location: {
    country?: string;
    city?: string;
  } | null;
}

export interface IPBan {
  id: string;
  ip_address: string;
  ip_range: string | null;
  reason: string | null;
  banned_by: string | null;
  banned_at: string;
  expires_at: string | null;
  is_active: boolean;
  ban_type: 'manual' | 'auto' | 'temporary';
  notes: string | null;
}

export interface SuspiciousActivity {
  id: string;
  ip_address: string;
  visitor_id: string | null;
  activity_type: string;
  description: string | null;
  metadata: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

/**
 * Investigate an IP address using multiple services for VPN detection
 */
export async function investigateIP(ip: string, adminId?: string): Promise<IPInvestigation> {
  const result: IPInvestigation = {
    ip,
    country: 'Unknown',
    country_code: '',
    city: 'Unknown',
    region: '',
    latitude: null,
    longitude: null,
    timezone: null,
    isp: null,
    org: null,
    asn: null,
    is_vpn: false,
    is_proxy: false,
    is_tor: false,
    is_datacenter: false,
    is_mobile: false,
    threat_level: 'low',
    threat_types: [],
    real_ip: null,
    real_location: null,
  };

  // Try ipapi.co first (HTTPS, works well on Vercel)
  try {
    const ipapiResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'LumoApp/1.0' },
      next: { revalidate: 3600 },
    });

    if (ipapiResponse.ok) {
      const data = await ipapiResponse.json();
      if (!data.error) {
        result.country = data.country_name || 'Unknown';
        result.country_code = data.country_code || '';
        result.city = data.city || 'Unknown';
        result.region = data.region || '';
        result.latitude = data.latitude || null;
        result.longitude = data.longitude || null;
        result.timezone = data.timezone || null;
        result.isp = data.org || null;
        result.asn = data.asn || null;
      }
    }
  } catch (error) {
    ipLogger.warn('ipapi.co lookup failed', { ip, error });
  }

  // Try ip-api.com for VPN/proxy detection (HTTP but has good detection)
  try {
    const ipApiResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,org,as,mobile,proxy,hosting`, {
      next: { revalidate: 3600 },
    });

    if (ipApiResponse.ok) {
      const data = await ipApiResponse.json();
      if (data.status === 'success') {
        // Fill in missing data
        if (!result.country || result.country === 'Unknown') {
          result.country = data.country || result.country;
          result.country_code = data.countryCode || result.country_code;
        }
        if (!result.city || result.city === 'Unknown') {
          result.city = data.city || result.city;
          result.region = data.regionName || result.region;
        }
        if (!result.latitude) result.latitude = data.lat || null;
        if (!result.longitude) result.longitude = data.lon || null;
        if (!result.timezone) result.timezone = data.timezone || null;
        if (!result.isp) result.isp = data.isp || null;
        if (!result.org) result.org = data.org || null;
        if (!result.asn) result.asn = data.as || null;
        
        result.is_mobile = data.mobile || false;
        result.is_proxy = data.proxy || false;
        result.is_datacenter = data.hosting || false;

        // If hosting/datacenter, likely VPN or proxy
        if (data.hosting) {
          result.is_vpn = true;
          result.threat_types.push('datacenter_ip');
        }
        if (data.proxy) {
          result.is_proxy = true;
          result.threat_types.push('proxy_detected');
        }
      }
    }
  } catch (error) {
    ipLogger.warn('ip-api.com lookup failed', { ip, error });
  }

  // Try proxycheck.io for VPN/Proxy detection (HTTPS, free tier: 1000/day)
  try {
    const proxyCheckResponse = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1&asn=1&risk=1`, {
      next: { revalidate: 3600 },
    });

    if (proxyCheckResponse.ok) {
      const data = await proxyCheckResponse.json();
      if (data.status === 'ok' && data[ip]) {
        const ipData = data[ip];
        
        if (ipData.proxy === 'yes') {
          result.is_proxy = true;
          result.threat_types.push('proxy_confirmed');
        }
        if (ipData.type === 'VPN') {
          result.is_vpn = true;
          result.threat_types.push('vpn_confirmed');
        }
        if (ipData.type === 'TOR') {
          result.is_tor = true;
          result.threat_types.push('tor_exit_node');
        }
        
        // Risk score: 0-100
        const risk = parseInt(ipData.risk) || 0;
        if (risk >= 75) {
          result.threat_level = 'critical';
        } else if (risk >= 50) {
          result.threat_level = 'high';
        } else if (risk >= 25) {
          result.threat_level = 'medium';
        }

        // Provider info for VPNs
        if (ipData.provider) {
          result.org = ipData.provider;
          result.threat_types.push(`provider:${ipData.provider}`);
        }
      }
    }
  } catch (error) {
    ipLogger.warn('proxycheck.io lookup failed', { ip, error });
  }

  // Calculate final threat level
  if (result.is_tor) {
    result.threat_level = 'critical';
  } else if (result.is_vpn && result.is_proxy) {
    result.threat_level = 'high';
  } else if (result.is_vpn || result.is_datacenter) {
    result.threat_level = result.threat_level === 'low' ? 'medium' : result.threat_level;
  }

  // Save investigation to database
  if (adminId) {
    try {
      await supabaseAdmin.from('ip_investigations').insert({
        ip_address: ip,
        investigated_by: adminId,
        investigation_data: result,
        is_vpn: result.is_vpn,
        is_proxy: result.is_proxy,
        is_tor: result.is_tor,
        is_datacenter: result.is_datacenter,
        threat_level: result.threat_level,
        real_ip: result.real_ip,
        real_location: result.real_location,
      });
    } catch (dbError) {
      ipLogger.error('Failed to save investigation', { ip, error: dbError });
    }
  }

  return result;
}

/**
 * Ban an IP address
 */
export async function banIP(
  ip: string,
  reason: string,
  adminId: string,
  options: {
    expiresAt?: Date;
    banType?: 'manual' | 'auto' | 'temporary';
    notes?: string;
    ipRange?: string;
  } = {}
): Promise<IPBan | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ip_bans')
      .insert({
        ip_address: ip,
        ip_range: options.ipRange || null,
        reason,
        banned_by: adminId,
        expires_at: options.expiresAt?.toISOString() || null,
        ban_type: options.banType || 'manual',
        notes: options.notes || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      ipLogger.error('Failed to ban IP', { ip, error });
      return null;
    }

    // Log suspicious activity
    await logSuspiciousActivity(ip, null, 'ip_banned', `IP banned: ${reason}`, { adminId, banType: options.banType }, 'high');

    return data;
  } catch (error) {
    ipLogger.error('Failed to ban IP', { ip, error });
    return null;
  }
}

/**
 * Unban an IP address
 */
export async function unbanIP(ip: string, adminId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('ip_bans')
      .update({ is_active: false })
      .eq('ip_address', ip)
      .eq('is_active', true);

    if (error) {
      ipLogger.error('Failed to unban IP', { ip, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to unban IP', { ip, error });
    return false;
  }
}

/**
 * Check if an IP is banned
 */
export async function isIPBanned(ip: string): Promise<{ banned: boolean; reason?: string; expiresAt?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('ip_bans')
      .select('*')
      .eq('ip_address', ip)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .maybeSingle();

    if (error || !data) {
      return { banned: false };
    }

    return { 
      banned: true, 
      reason: data.reason || 'No reason provided',
      expiresAt: data.expires_at 
    };
  } catch (error) {
    ipLogger.error('Failed to check IP ban', { ip, error });
    return { banned: false };
  }
}

/**
 * Get all banned IPs
 */
export async function getBannedIPs(includeInactive = false): Promise<IPBan[]> {
  try {
    let query = supabaseAdmin
      .from('ip_bans')
      .select('*')
      .order('banned_at', { ascending: false });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;

    if (error) {
      ipLogger.error('Failed to get banned IPs', error);
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get banned IPs', error as Error);
    return [];
  }
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  ip: string,
  visitorId: string | null,
  activityType: string,
  description: string,
  metadata: any = {},
  severity: 'low' | 'medium' | 'high' | 'critical' = 'low'
): Promise<void> {
  try {
    await supabaseAdmin.from('suspicious_activities').insert({
      ip_address: ip,
      visitor_id: visitorId,
      activity_type: activityType,
      description,
      metadata,
      severity,
    });
  } catch (error) {
    ipLogger.error('Failed to log suspicious activity', { ip, activityType, error });
  }
}

/**
 * Get suspicious activities
 */
export async function getSuspiciousActivities(
  options: {
    unresolvedOnly?: boolean;
    limit?: number;
    severity?: string;
  } = {}
): Promise<SuspiciousActivity[]> {
  try {
    let query = supabaseAdmin
      .from('suspicious_activities')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(options.limit || 100);

    if (options.unresolvedOnly) {
      query = query.eq('is_resolved', false);
    }

    if (options.severity) {
      query = query.eq('severity', options.severity);
    }

    const { data, error } = await query;

    if (error) {
      ipLogger.error('Failed to get suspicious activities', error);
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get suspicious activities', error as Error);
    return [];
  }
}

/**
 * Resolve a suspicious activity
 */
export async function resolveSuspiciousActivity(
  activityId: string,
  adminId: string,
  notes: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('suspicious_activities')
      .update({
        is_resolved: true,
        resolved_by: adminId,
        resolved_at: new Date().toISOString(),
        resolution_notes: notes,
      })
      .eq('id', activityId);

    if (error) {
      ipLogger.error('Failed to resolve suspicious activity', { activityId, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to resolve suspicious activity', { activityId, error });
    return false;
  }
}

/**
 * Get IP investigation history
 */
export async function getIPInvestigations(ip?: string, limit = 50): Promise<any[]> {
  try {
    let query = supabaseAdmin
      .from('ip_investigations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (ip) {
      query = query.eq('ip_address', ip);
    }

    const { data, error } = await query;

    if (error) {
      ipLogger.error('Failed to get IP investigations', error);
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get IP investigations', error as Error);
    return [];
  }
}

/**
 * Quick VPN check for visitor tracking
 */
export async function quickVPNCheck(ip: string): Promise<{ is_vpn: boolean; is_proxy: boolean; threat_level: string }> {
  try {
    // Use cached investigation if available (within last 24 hours)
    const { data: cached } = await supabaseAdmin
      .from('ip_investigations')
      .select('is_vpn, is_proxy, threat_level')
      .eq('ip_address', ip)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cached) {
      return {
        is_vpn: cached.is_vpn,
        is_proxy: cached.is_proxy,
        threat_level: cached.threat_level,
      };
    }

    // Quick check with proxycheck.io (HTTPS, works on Vercel serverless)
    // Free tier: 1000 requests/day
    try {
      const response = await fetch(`https://proxycheck.io/v2/${ip}?vpn=1`, {
        next: { revalidate: 3600 },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok' && data[ip]) {
          const ipData = data[ip];
          const is_vpn = ipData.proxy === 'yes' || ipData.type === 'VPN';
          const is_proxy = ipData.proxy === 'yes';
          const threat_level = is_vpn || is_proxy ? 'medium' : 'low';

          return { is_vpn, is_proxy, threat_level };
        }
      }
    } catch {
      // Fallback to ip-api (note: uses HTTP, may not work in all Vercel regions)
      try {
        const response = await fetch(`http://ip-api.com/json/${ip}?fields=proxy,hosting`, {
          next: { revalidate: 3600 },
        });

        if (response.ok) {
          const data = await response.json();
          const is_vpn = data.hosting || false;
          const is_proxy = data.proxy || false;
          const threat_level = is_vpn || is_proxy ? 'medium' : 'low';

          return { is_vpn, is_proxy, threat_level };
        }
      } catch {
        // Ignore fallback errors
      }
    }

    return { is_vpn: false, is_proxy: false, threat_level: 'low' };
  } catch (error) {
    return { is_vpn: false, is_proxy: false, threat_level: 'low' };
  }
}

// =====================================================
// USER-IP TRACKING FUNCTIONS
// =====================================================

export interface UserIPHistory {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  user_agent: string | null;
  device_fingerprint: string | null;
  login_type: string;
  is_vpn: boolean;
  is_proxy: boolean;
  threat_level: string;
  country: string | null;
  city: string | null;
  session_id: string | null;
  created_at: string;
}

export interface UserKnownIP {
  id: string;
  user_id: string;
  email: string;
  ip_address: string;
  first_seen_at: string;
  last_seen_at: string;
  login_count: number;
  is_trusted: boolean;
  is_blocked: boolean;
  device_info: any;
  location_info: any;
  notes: string | null;
}

export interface UserSecurityFlags {
  id: string;
  user_id: string;
  email: string;
  is_flagged: boolean;
  flag_reason: string | null;
  flagged_by: string | null;
  flagged_at: string | null;
  unique_ips_count: number;
  unique_countries_count: number;
  vpn_login_count: number;
  last_login_ip: string | null;
  last_login_at: string | null;
  suspicious_pattern_detected: boolean;
  risk_score: number;
  created_at: string;
  updated_at: string;
}

export interface MultiAccountIP {
  ip_address: string;
  account_count: number;
  emails: string[];
  user_ids: string[];
}

/**
 * Record a user login with their IP address
 */
export async function recordUserLogin(
  userId: string,
  email: string,
  ipAddress: string,
  options: {
    userAgent?: string;
    deviceFingerprint?: string;
    loginType?: 'password' | 'magic_link' | 'oauth' | 'phone' | '2fa';
    sessionId?: string;
    // Vercel geolocation headers (passed from the API route)
    country?: string | null;
    city?: string | null;
  } = {}
): Promise<void> {
  try {
    // Get VPN/location info
    const vpnCheck = await quickVPNCheck(ipAddress);
    let country: string | null = options.country || null;
    let city: string | null = options.city || null;

    // Only fetch location from external API if not provided by Vercel headers
    if (!country && !city) {
      try {
        // Use HTTPS endpoint (ipapi.co) for Vercel compatibility
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
          headers: { 'User-Agent': 'LumoApp/1.0' },
          next: { revalidate: 3600 },
        });
        if (response.ok) {
          const data = await response.json();
          if (!data.error) {
            country = data.country_name || null;
            city = data.city || null;
          }
        }
      } catch {
        // Ignore location lookup errors
      }
    }

    // Call the database function to record the login
    const { error } = await supabaseAdmin.rpc('record_user_login', {
      p_user_id: userId,
      p_email: email,
      p_ip_address: ipAddress,
      p_user_agent: options.userAgent || null,
      p_device_fingerprint: options.deviceFingerprint || null,
      p_login_type: options.loginType || 'password',
      p_is_vpn: vpnCheck.is_vpn,
      p_is_proxy: vpnCheck.is_proxy,
      p_threat_level: vpnCheck.threat_level,
      p_country: country,
      p_city: city,
      p_session_id: options.sessionId || null,
    });

    if (error) {
      ipLogger.error('Failed to record user login', { userId, email, ipAddress, error });
    }

    // Check for suspicious patterns
    await checkSuspiciousPatterns(userId, email, ipAddress, vpnCheck.is_vpn);
  } catch (error) {
    ipLogger.error('Failed to record user login', { userId, email, ipAddress, error });
  }
}

/**
 * Check for suspicious login patterns and flag if needed
 */
async function checkSuspiciousPatterns(
  userId: string,
  email: string,
  ipAddress: string,
  isVpn: boolean
): Promise<void> {
  try {
    // Get user's security flags
    const { data: flags } = await supabaseAdmin
      .from('user_security_flags')
      .select('*')
      .eq('email', email)
      .single();

    if (!flags) return;

    let shouldFlag = false;
    let flagReasons: string[] = [];
    let riskScore = flags.risk_score || 0;

    // Check for multiple unique IPs (more than 10)
    if (flags.unique_ips_count > 10) {
      riskScore += 10;
      flagReasons.push(`High number of unique IPs: ${flags.unique_ips_count}`);
    }

    // Check for multiple countries (more than 5)
    if (flags.unique_countries_count > 5) {
      riskScore += 20;
      flagReasons.push(`Multiple countries detected: ${flags.unique_countries_count}`);
    }

    // Check for high VPN usage
    if (flags.vpn_login_count > 5) {
      riskScore += 15;
      flagReasons.push(`Frequent VPN usage: ${flags.vpn_login_count} logins`);
    }

    // Check if this IP is used by multiple accounts
    const { data: multiAccount } = await supabaseAdmin
      .from('user_known_ips')
      .select('user_id, email')
      .eq('ip_address', ipAddress);

    if (multiAccount && multiAccount.length > 2) {
      riskScore += 25;
      shouldFlag = true;
      flagReasons.push(`IP shared by ${multiAccount.length} accounts`);

      // Log suspicious activity
      await logSuspiciousActivity(
        ipAddress,
        null,
        'multiple_accounts',
        `IP ${ipAddress} is used by ${multiAccount.length} accounts: ${multiAccount.map(a => a.email).join(', ')}`,
        { emails: multiAccount.map(a => a.email), user_ids: multiAccount.map(a => a.user_id) },
        multiAccount.length > 5 ? 'high' : 'medium'
      );
    }

    // Cap risk score at 100
    riskScore = Math.min(riskScore, 100);

    // Update flags if needed
    if (shouldFlag || riskScore > 50) {
      await supabaseAdmin
        .from('user_security_flags')
        .update({
          is_flagged: true,
          flag_reason: flagReasons.join('; '),
          suspicious_pattern_detected: true,
          risk_score: riskScore,
        })
        .eq('email', email);
    } else {
      // Just update risk score
      await supabaseAdmin
        .from('user_security_flags')
        .update({ risk_score: riskScore })
        .eq('email', email);
    }
  } catch (error) {
    ipLogger.error('Failed to check suspicious patterns', { userId, email, error });
  }
}

/**
 * Get all users who have logged in from a specific IP
 */
export async function getUsersByIP(ipAddress: string): Promise<UserKnownIP[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_known_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .order('last_seen_at', { ascending: false });

    if (error) {
      ipLogger.error('Failed to get users by IP', { ipAddress, error });
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get users by IP', { ipAddress, error });
    return [];
  }
}

/**
 * Get all IPs used by a specific user
 */
export async function getIPsByUser(userId: string): Promise<UserKnownIP[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_known_ips')
      .select('*')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });

    if (error) {
      ipLogger.error('Failed to get IPs by user', { userId, error });
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get IPs by user', { userId, error });
    return [];
  }
}

/**
 * Get user login history
 */
export async function getUserLoginHistory(
  userId?: string,
  email?: string,
  ipAddress?: string,
  limit = 100
): Promise<UserIPHistory[]> {
  try {
    let query = supabaseAdmin
      .from('user_ip_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (userId) query = query.eq('user_id', userId);
    if (email) query = query.eq('email', email);
    if (ipAddress) query = query.eq('ip_address', ipAddress);

    const { data, error } = await query;

    if (error) {
      ipLogger.error('Failed to get user login history', { userId, email, ipAddress, error });
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get user login history', error as Error);
    return [];
  }
}

/**
 * Get users with security flags
 */
export async function getFlaggedUsers(options: {
  flaggedOnly?: boolean;
  minRiskScore?: number;
  limit?: number;
} = {}): Promise<UserSecurityFlags[]> {
  try {
    let query = supabaseAdmin
      .from('user_security_flags')
      .select('*')
      .order('risk_score', { ascending: false })
      .limit(options.limit || 100);

    if (options.flaggedOnly) {
      query = query.eq('is_flagged', true);
    }

    if (options.minRiskScore) {
      query = query.gte('risk_score', options.minRiskScore);
    }

    const { data, error } = await query;

    if (error) {
      ipLogger.error('Failed to get flagged users', error);
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to get flagged users', error as Error);
    return [];
  }
}

/**
 * Get IPs used by multiple accounts
 */
export async function getMultiAccountIPs(minAccounts = 2): Promise<MultiAccountIP[]> {
  try {
    const { data, error } = await supabaseAdmin.rpc('detect_multi_account_ips', {
      min_accounts: minAccounts,
    });

    if (error) {
      ipLogger.error('Failed to detect multi-account IPs', error);
      return [];
    }

    return data || [];
  } catch (error) {
    ipLogger.error('Failed to detect multi-account IPs', error as Error);
    return [];
  }
}

/**
 * Flag or unflag a user
 */
export async function flagUser(
  email: string,
  adminId: string,
  flagReason?: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_security_flags')
      .update({
        is_flagged: true,
        flag_reason: flagReason || 'Manually flagged by admin',
        flagged_by: adminId,
        flagged_at: new Date().toISOString(),
      })
      .eq('email', email);

    if (error) {
      ipLogger.error('Failed to flag user', { email, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to flag user', { email, error });
    return false;
  }
}

/**
 * Unflag a user
 */
export async function unflagUser(email: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_security_flags')
      .update({
        is_flagged: false,
        flag_reason: null,
        flagged_by: null,
        flagged_at: null,
      })
      .eq('email', email);

    if (error) {
      ipLogger.error('Failed to unflag user', { email, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to unflag user', { email, error });
    return false;
  }
}

/**
 * Block or unblock a specific IP for a user
 */
export async function setUserIPBlocked(
  userId: string,
  ipAddress: string,
  blocked: boolean
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_known_ips')
      .update({ is_blocked: blocked })
      .eq('user_id', userId)
      .eq('ip_address', ipAddress);

    if (error) {
      ipLogger.error('Failed to set user IP blocked status', { userId, ipAddress, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to set user IP blocked status', { userId, ipAddress, error });
    return false;
  }
}

/**
 * Mark an IP as trusted for a user
 */
export async function setUserIPTrusted(
  userId: string,
  ipAddress: string,
  trusted: boolean
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('user_known_ips')
      .update({ is_trusted: trusted })
      .eq('user_id', userId)
      .eq('ip_address', ipAddress);

    if (error) {
      ipLogger.error('Failed to set user IP trusted status', { userId, ipAddress, error });
      return false;
    }

    return true;
  } catch (error) {
    ipLogger.error('Failed to set user IP trusted status', { userId, ipAddress, error });
    return false;
  }
}

/**
 * Get security summary for a user by email
 */
export async function getUserSecuritySummary(email: string): Promise<{
  flags: UserSecurityFlags | null;
  recentLogins: UserIPHistory[];
  knownIPs: UserKnownIP[];
  sharedIPs: MultiAccountIP[];
} | null> {
  try {
    // Get security flags
    const { data: flags } = await supabaseAdmin
      .from('user_security_flags')
      .select('*')
      .eq('email', email)
      .single();

    if (!flags) {
      return null;
    }

    // Get recent logins
    const recentLogins = await getUserLoginHistory(undefined, email, undefined, 20);

    // Get known IPs
    const knownIPs = await getIPsByUser(flags.user_id);

    // Check for shared IPs
    const sharedIPs: MultiAccountIP[] = [];
    for (const knownIP of knownIPs) {
      const usersOnIP = await getUsersByIP(knownIP.ip_address);
      if (usersOnIP.length > 1) {
        sharedIPs.push({
          ip_address: knownIP.ip_address,
          account_count: usersOnIP.length,
          emails: usersOnIP.map(u => u.email),
          user_ids: usersOnIP.map(u => u.user_id),
        });
      }
    }

    return {
      flags,
      recentLogins,
      knownIPs,
      sharedIPs,
    };
  } catch (error) {
    ipLogger.error('Failed to get user security summary', { email, error });
    return null;
  }
}
