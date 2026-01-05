import { NextResponse } from 'next/server';
import { recordVisitor, recordPageView, updateSessionDuration } from '@/services/visitorService';
import { headers } from 'next/headers';
import { isIPBanned, quickVPNCheck, logSuspiciousActivity } from '@/services/ipService';

// Helper to parse user agent
function parseUserAgent(ua: string): { browser: string; os: string; device: 'desktop' | 'mobile' | 'tablet' | 'unknown' } {
  let browser = 'Unknown';
  let os = 'Unknown';
  let device: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';

  // Detect browser
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect device type
  if (ua.includes('Mobile') || ua.includes('Android') && !ua.includes('Tablet')) {
    device = 'mobile';
  } else if (ua.includes('Tablet') || ua.includes('iPad')) {
    device = 'tablet';
  } else if (ua.includes('Windows') || ua.includes('Mac OS') || ua.includes('Linux')) {
    device = 'desktop';
  }

  return { browser, os, device };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, visitor_id, page_path, page_title, referrer, duration, consent_given, geo_data } = body;

    const headersList = await headers();
    const userAgent = headersList.get('user-agent') || '';
    
    // Log all headers for debugging (can be removed in production)
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      if (key.toLowerCase().includes('ip') || key.toLowerCase().includes('forward') || key.toLowerCase().includes('client') || key.toLowerCase().includes('real')) {
        allHeaders[key] = value;
      }
    });
    
    // IP detection priority:
    // 1. Vercel's forwarded IP (most reliable on Vercel)
    // 2. Cloudflare connecting IP
    // 3. True-Client-IP (Akamai, some CDNs)
    // 4. X-Forwarded-For (standard proxy header)
    // 5. X-Real-IP (nginx)
    // 6. Client-provided geo_data.ip (fallback)
    const vercelIp = headersList.get('x-vercel-forwarded-for');
    const cfConnectingIp = headersList.get('cf-connecting-ip');
    const trueClientIp = headersList.get('true-client-ip');
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    
    let ip = vercelIp?.split(',')[0]?.trim() 
      || cfConnectingIp 
      || trueClientIp
      || forwardedFor?.split(',')[0]?.trim() 
      || realIp 
      || geo_data?.ip  // Fallback to IP from geo lookup
      || 'unknown';
    
    // Clean up IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1';
    }
    
    // Debug log with all detected headers
    console.log('[Visitor POST IP]', { 
      resolvedIp: ip, 
      vercelIp, 
      cfConnectingIp, 
      trueClientIp,
      forwardedFor, 
      realIp,
      geoDataIp: geo_data?.ip,
      relevantHeaders: allHeaders 
    });

    // Check if IP is banned
    const banStatus = await isIPBanned(ip);
    if (banStatus.banned) {
      console.log('[Visitor] Banned IP attempted access:', ip, banStatus.reason);
      return NextResponse.json({ 
        success: false, 
        error: 'access_denied',
        message: 'Access denied' 
      }, { status: 403 });
    }

    // Quick VPN check for non-localhost IPs
    let vpnInfo = { is_vpn: false, is_proxy: false, threat_level: 'low' };
    if (ip !== '127.0.0.1' && ip !== 'localhost' && ip !== 'unknown' && !ip.startsWith('192.168.') && !ip.startsWith('10.')) {
      vpnInfo = await quickVPNCheck(ip);
      
      // Log if VPN/proxy detected
      if (vpnInfo.is_vpn || vpnInfo.is_proxy) {
        await logSuspiciousActivity(
          ip,
          visitor_id,
          vpnInfo.is_vpn ? 'vpn_detected' : 'proxy_detected',
          `${vpnInfo.is_vpn ? 'VPN' : 'Proxy'} connection detected`,
          { threat_level: vpnInfo.threat_level, geo_data },
          vpnInfo.threat_level as 'low' | 'medium' | 'high' | 'critical'
        );
      }
    }

    const { browser, os, device } = parseUserAgent(userAgent);

    if (action === 'visit') {
      // Record new visit or update existing
      const visitor = await recordVisitor({
        visitor_id,
        ip_address: ip,
        country: geo_data?.country || null,
        country_code: geo_data?.country_code || null,
        city: geo_data?.city || null,
        region: geo_data?.region || null,
        latitude: geo_data?.latitude || null,
        longitude: geo_data?.longitude || null,
        timezone: geo_data?.timezone || null,
        isp: geo_data?.isp || null,
        user_agent: userAgent,
        device_type: device,
        browser,
        os,
        referrer: referrer || null,
        landing_page: page_path || '/',
        consent_given: consent_given || false,
        is_vpn: vpnInfo.is_vpn,
        is_proxy: vpnInfo.is_proxy,
        threat_level: vpnInfo.threat_level,
      });

      return NextResponse.json({ success: true, visitor, vpn_detected: vpnInfo.is_vpn || vpnInfo.is_proxy });
    }

    if (action === 'pageview') {
      // Record page view
      const pageView = await recordPageView({
        visitor_id,
        page_path: page_path || '/',
        page_title: page_title || null,
        referrer: referrer || null,
      });

      return NextResponse.json({ success: true, pageView });
    }

    if (action === 'heartbeat') {
      // Update session duration
      await updateSessionDuration(visitor_id, duration || 0);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in visitor tracking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch geo data for the client
export async function GET(request: Request) {
  try {
    const headersList = await headers();
    
    // Vercel-specific headers for accurate IP detection
    const vercelIp = headersList.get('x-vercel-forwarded-for');
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const cfConnectingIp = headersList.get('cf-connecting-ip'); // Cloudflare
    const trueClientIp = headersList.get('true-client-ip'); // Some CDNs
    
    // Vercel built-in geo headers (no API call needed)
    const vercelCity = headersList.get('x-vercel-ip-city');
    const vercelCountry = headersList.get('x-vercel-ip-country');
    const vercelRegion = headersList.get('x-vercel-ip-country-region');
    const vercelLatitude = headersList.get('x-vercel-ip-latitude');
    const vercelLongitude = headersList.get('x-vercel-ip-longitude');
    const vercelTimezone = headersList.get('x-vercel-ip-timezone');
    
    // Priority: Vercel > CF > True-Client-IP > Forwarded-For > Real-IP
    const ip = vercelIp?.split(',')[0]?.trim() 
      || cfConnectingIp 
      || trueClientIp
      || forwardedFor?.split(',')[0]?.trim() 
      || realIp 
      || '';

    // Debug log all headers for troubleshooting
    console.log('[Visitor IP Detection]', {
      vercelIp,
      cfConnectingIp,
      trueClientIp,
      forwardedFor,
      realIp,
      resolvedIp: ip,
      vercelGeo: { city: vercelCity, country: vercelCountry }
    });

    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.json({ 
        ip: 'localhost', 
        country: 'Local Development', 
        city: 'Development',
        country_code: 'DEV'
      });
    }
    
    // If Vercel geo headers are available, use them directly (fastest)
    if (vercelCountry) {
      return NextResponse.json({
        ip,
        country: vercelCountry,
        country_code: vercelCountry,
        city: vercelCity ? decodeURIComponent(vercelCity) : 'Unknown',
        region: vercelRegion || null,
        latitude: vercelLatitude ? parseFloat(vercelLatitude) : null,
        longitude: vercelLongitude ? parseFloat(vercelLongitude) : null,
        timezone: vercelTimezone || null,
        isp: null,
      });
    }

    // Use ipapi.co for geolocation (HTTPS, free tier: 30k/month)
    try {
      const geoResponse = await fetch(`https://ipapi.co/${ip}/json/`, {
        headers: {
          'User-Agent': 'JulaZone/1.0',
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (!geoData.error) {
          return NextResponse.json({
            ip,
            country: geoData.country_name || 'Unknown',
            country_code: geoData.country_code || null,
            city: geoData.city || 'Unknown',
            region: geoData.region || null,
            latitude: geoData.latitude || null,
            longitude: geoData.longitude || null,
            timezone: geoData.timezone || null,
            isp: geoData.org || null,
          });
        }
      }
    } catch (geoError) {
      console.error('Geo lookup failed:', geoError);
    }

    // Fallback: Try ipinfo.io (HTTPS, free tier: 50k/month)
    try {
      const fallbackResponse = await fetch(`https://ipinfo.io/${ip}/json`, {
        headers: {
          'User-Agent': 'JulaZone/1.0',
        },
        next: { revalidate: 3600 },
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const [lat, lon] = (fallbackData.loc || ',').split(',').map(Number);
        return NextResponse.json({
          ip,
          country: fallbackData.country || 'Unknown',
          country_code: fallbackData.country || null,
          city: fallbackData.city || 'Unknown',
          region: fallbackData.region || null,
          latitude: lat || null,
          longitude: lon || null,
          timezone: fallbackData.timezone || null,
          isp: fallbackData.org || null,
        });
      }
    } catch (fallbackError) {
      console.error('Fallback geo lookup failed:', fallbackError);
    }

    return NextResponse.json({ ip, country: 'Unknown', city: 'Unknown' });
  } catch (error) {
    console.error('Error fetching geo data:', error);
    return NextResponse.json({ error: 'Failed to fetch geo data' }, { status: 500 });
  }
}
