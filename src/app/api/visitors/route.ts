import { NextResponse } from 'next/server';
import { recordVisitor, recordPageView, updateSessionDuration } from '@/services/visitorService';
import { headers } from 'next/headers';

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
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

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
      });

      return NextResponse.json({ success: true, visitor });
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
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || '';

    if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
      return NextResponse.json({ ip: 'localhost', country: 'Local', city: 'Development' });
    }

    // Use ip-api.com for geolocation (free, no API key needed for non-commercial use)
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city,lat,lon,timezone,isp`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (geoResponse.ok) {
        const geoData = await geoResponse.json();
        if (geoData.status === 'success') {
          return NextResponse.json({
            ip,
            country: geoData.country,
            country_code: geoData.countryCode,
            city: geoData.city,
            region: geoData.regionName,
            latitude: geoData.lat,
            longitude: geoData.lon,
            timezone: geoData.timezone,
            isp: geoData.isp,
          });
        }
      }
    } catch (geoError) {
      console.error('Geo lookup failed:', geoError);
    }

    return NextResponse.json({ ip, country: 'Unknown', city: 'Unknown' });
  } catch (error) {
    console.error('Error fetching geo data:', error);
    return NextResponse.json({ error: 'Failed to fetch geo data' }, { status: 500 });
  }
}
