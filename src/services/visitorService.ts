// Visitor tracking service - server-side only
// Do NOT add 'use server' here as these functions are called from API routes

import { logger } from '@/lib/logger';

const visitorLogger = logger.child('VisitorService');

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface Visitor {
  id: string;
  visitor_id: string;
  ip_address: string | null;
  country: string | null;
  country_code: string | null;
  city: string | null;
  region: string | null;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isp: string | null;
  user_agent: string | null;
  device_type: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser: string | null;
  os: string | null;
  referrer: string | null;
  landing_page: string;
  page_views: number;
  session_duration: number; // in seconds
  last_activity: string;
  created_at: string;
  is_returning: boolean;
  consent_given: boolean;
}

export interface VisitorStats {
  totalVisitors: number;
  uniqueVisitors: number;
  todayVisitors: number;
  averageSessionDuration: number;
  topCountries: { country: string; count: number }[];
  topPages: { page: string; views: number }[];
  deviceBreakdown: { device: string; count: number }[];
  browserBreakdown: { browser: string; count: number }[];
  visitorsOverTime: { date: string; count: number }[];
  returningVisitors: number;
  newVisitors: number;
}

export interface PageView {
  id: string;
  visitor_id: string;
  page_path: string;
  page_title: string | null;
  referrer: string | null;
  time_on_page: number | null;
  created_at: string;
}

// Get all visitors with pagination
export async function getVisitors(
  page: number = 1,
  limit: number = 50,
  filters?: {
    country?: string;
    device?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<{ visitors: Visitor[]; total: number }> {
  try {
    let query = supabaseAdmin.from('visitors').select('*', { count: 'exact' });

    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.device) {
      query = query.eq('device_type', filters.device);
    }
    if (filters?.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    const { data, error, count } = await query
      .order('last_activity', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      visitorLogger.error('Error fetching visitors:', error);
      return { visitors: [], total: 0 };
    }

    return { visitors: data || [], total: count || 0 };
  } catch (error) {
    visitorLogger.error('Error fetching visitors:', error);
    return { visitors: [], total: 0 };
  }
}

// Get visitor statistics
export async function getVisitorStats(): Promise<VisitorStats> {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Get total visitors
    const { count: totalVisitors } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    // Get unique visitors (by visitor_id)
    const { data: uniqueData } = await supabaseAdmin
      .from('visitors')
      .select('visitor_id');
    const uniqueVisitors = new Set(uniqueData?.map(v => v.visitor_id)).size;

    // Get today's visitors
    const { count: todayVisitors } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today);

    // Get average session duration
    const { data: durationData } = await supabaseAdmin
      .from('visitors')
      .select('session_duration');
    const avgDuration = durationData?.length
      ? durationData.reduce((sum, v) => sum + (v.session_duration || 0), 0) / durationData.length
      : 0;

    // Get top countries
    const { data: countryData } = await supabaseAdmin
      .from('visitors')
      .select('country');
    const countryCounts = countryData?.reduce((acc: Record<string, number>, v) => {
      const country = v.country || 'Unknown';
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    }, {}) || {};
    const topCountries = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get top pages
    const { data: pageData } = await supabaseAdmin
      .from('page_views')
      .select('page_path');
    const pageCounts = pageData?.reduce((acc: Record<string, number>, v) => {
      acc[v.page_path] = (acc[v.page_path] || 0) + 1;
      return acc;
    }, {}) || {};
    const topPages = Object.entries(pageCounts)
      .map(([page, views]) => ({ page, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Get device breakdown
    const { data: deviceData } = await supabaseAdmin
      .from('visitors')
      .select('device_type');
    const deviceCounts = deviceData?.reduce((acc: Record<string, number>, v) => {
      const device = v.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {}) || {};
    const deviceBreakdown = Object.entries(deviceCounts)
      .map(([device, count]) => ({ device, count }))
      .sort((a, b) => b.count - a.count);

    // Get browser breakdown
    const { data: browserData } = await supabaseAdmin
      .from('visitors')
      .select('browser');
    const browserCounts = browserData?.reduce((acc: Record<string, number>, v) => {
      const browser = v.browser || 'Unknown';
      acc[browser] = (acc[browser] || 0) + 1;
      return acc;
    }, {}) || {};
    const browserBreakdown = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get visitors over time (last 30 days)
    const { data: timeData } = await supabaseAdmin
      .from('visitors')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo);
    const dateCounts = timeData?.reduce((acc: Record<string, number>, v) => {
      const date = new Date(v.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};
    const visitorsOverTime = Object.entries(dateCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Get returning vs new visitors
    const { count: returningCount } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .eq('is_returning', true);

    return {
      totalVisitors: totalVisitors || 0,
      uniqueVisitors,
      todayVisitors: todayVisitors || 0,
      averageSessionDuration: Math.round(avgDuration),
      topCountries,
      topPages,
      deviceBreakdown,
      browserBreakdown,
      visitorsOverTime,
      returningVisitors: returningCount || 0,
      newVisitors: (totalVisitors || 0) - (returningCount || 0),
    };
  } catch (error) {
    visitorLogger.error('Error fetching visitor stats:', error);
    return {
      totalVisitors: 0,
      uniqueVisitors: 0,
      todayVisitors: 0,
      averageSessionDuration: 0,
      topCountries: [],
      topPages: [],
      deviceBreakdown: [],
      browserBreakdown: [],
      visitorsOverTime: [],
      returningVisitors: 0,
      newVisitors: 0,
    };
  }
}

// Record a new visitor or update existing
export async function recordVisitor(visitorData: {
  visitor_id: string;
  ip_address?: string;
  country?: string;
  country_code?: string;
  city?: string;
  region?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  isp?: string;
  user_agent?: string;
  device_type?: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page: string;
  consent_given?: boolean;
  is_vpn?: boolean;
  is_proxy?: boolean;
  threat_level?: string;
}): Promise<Visitor | null> {
  try {
    console.log('[VisitorService] recordVisitor called with visitor_id:', visitorData.visitor_id);
    
    // Check if visitor exists
    const { data: existing, error: selectError } = await supabaseAdmin
      .from('visitors')
      .select('*')
      .eq('visitor_id', visitorData.visitor_id)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is expected for new visitors
      console.error('[VisitorService] Error checking existing visitor:', selectError);
    }

    console.log('[VisitorService] Existing visitor found:', !!existing);

    if (existing) {
      // Update existing visitor - also update geo data if it was missing
      const updateData: Record<string, any> = {
        page_views: existing.page_views + 1,
        last_activity: new Date().toISOString(),
        is_returning: true,
      };
      
      // Update IP and geo data if previously missing or if we have better data
      if (visitorData.ip_address && visitorData.ip_address !== 'unknown' && 
          (!existing.ip_address || existing.ip_address === 'unknown')) {
        updateData.ip_address = visitorData.ip_address;
      }
      if (visitorData.country && !existing.country) {
        updateData.country = visitorData.country;
      }
      if (visitorData.country_code && !existing.country_code) {
        updateData.country_code = visitorData.country_code;
      }
      if (visitorData.city && (!existing.city || existing.city === 'Unknown')) {
        updateData.city = visitorData.city;
      }
      if (visitorData.region && !existing.region) {
        updateData.region = visitorData.region;
      }
      if (visitorData.latitude && !existing.latitude) {
        updateData.latitude = visitorData.latitude;
      }
      if (visitorData.longitude && !existing.longitude) {
        updateData.longitude = visitorData.longitude;
      }
      if (visitorData.timezone && !existing.timezone) {
        updateData.timezone = visitorData.timezone;
      }
      if (visitorData.isp && !existing.isp) {
        updateData.isp = visitorData.isp;
      }
      
      const { data, error } = await supabaseAdmin
        .from('visitors')
        .update(updateData)
        .eq('visitor_id', visitorData.visitor_id)
        .select()
        .single();

      if (error) {
        console.error('[VisitorService] Error updating visitor:', error.message, error.code, error.details);
        visitorLogger.error('Error updating visitor:', error);
        return null;
      }
      console.log('[VisitorService] Visitor updated successfully:', data?.id);
      return data;
    } else {
      // Create new visitor
      console.log('[VisitorService] Creating new visitor...');
      const insertData = {
        ...visitorData,
        page_views: 1,
        session_duration: 0,
        last_activity: new Date().toISOString(),
        is_returning: false,
      };
      console.log('[VisitorService] Insert data:', JSON.stringify(insertData, null, 2));
      
      const { data, error } = await supabaseAdmin
        .from('visitors')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('[VisitorService] Error creating visitor:', error.message, error.code, error.details, error.hint);
        visitorLogger.error('Error creating visitor:', error);
        return null;
      }
      console.log('[VisitorService] Visitor created successfully:', data?.id);
      return data;
    }
  } catch (error) {
    console.error('[VisitorService] Unexpected error recording visitor:', error);
    visitorLogger.error('Error recording visitor:', error);
    return null;
  }
}

// Record a page view
export async function recordPageView(pageViewData: {
  visitor_id: string;
  page_path: string;
  page_title?: string;
  referrer?: string;
}): Promise<PageView | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('page_views')
      .insert({
        ...pageViewData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      visitorLogger.error('Error recording page view:', error);
      return null;
    }

    // Also update visitor's page_views count and last_activity
    // Use raw SQL increment to avoid race conditions
    await supabaseAdmin
      .from('visitors')
      .update({
        last_activity: new Date().toISOString(),
      })
      .eq('visitor_id', pageViewData.visitor_id);
    
    // Call RPC to increment page views separately
    await supabaseAdmin.rpc('increment_page_views', { vid: pageViewData.visitor_id });

    return data;
  } catch (error) {
    visitorLogger.error('Error recording page view:', error);
    return null;
  }
}

// Update session duration
export async function updateSessionDuration(
  visitor_id: string,
  duration: number
): Promise<void> {
  try {
    await supabaseAdmin
      .from('visitors')
      .update({
        session_duration: duration,
        last_activity: new Date().toISOString(),
      })
      .eq('visitor_id', visitor_id);
  } catch (error) {
    visitorLogger.error('Error updating session duration:', error);
  }
}

// Delete visitor data (for privacy compliance)
export async function deleteVisitorData(visitor_id: string): Promise<boolean> {
  try {
    // Delete page views first
    await supabaseAdmin
      .from('page_views')
      .delete()
      .eq('visitor_id', visitor_id);

    // Delete visitor
    const { error } = await supabaseAdmin
      .from('visitors')
      .delete()
      .eq('visitor_id', visitor_id);

    if (error) {
      visitorLogger.error('Error deleting visitor:', error);
      return false;
    }
    return true;
  } catch (error) {
    visitorLogger.error('Error deleting visitor data:', error);
    return false;
  }
}

// Get live visitors (active in last 5 minutes)
export async function getLiveVisitors(): Promise<number> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', fiveMinutesAgo);

    return count || 0;
  } catch (error) {
    visitorLogger.error('Error getting live visitors:', error);
    return 0;
  }
}

// Get visitors filtered by active status
export async function getVisitorsByStatus(
  status: 'active' | 'inactive' | 'all' = 'all',
  page: number = 1,
  limit: number = 50
): Promise<{ visitors: Visitor[]; total: number; activeCount: number; inactiveCount: number }> {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    let query = supabaseAdmin.from('visitors').select('*', { count: 'exact' });
    
    if (status === 'active') {
      query = query.gte('last_activity', fiveMinutesAgo);
    } else if (status === 'inactive') {
      query = query.lt('last_activity', fiveMinutesAgo);
    }
    
    const { data, error, count } = await query
      .order('last_activity', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      visitorLogger.error('Error fetching visitors by status:', error);
      return { visitors: [], total: 0, activeCount: 0, inactiveCount: 0 };
    }

    // Get counts for both statuses
    const { count: activeCount } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', fiveMinutesAgo);

    const { count: inactiveCount } = await supabaseAdmin
      .from('visitors')
      .select('*', { count: 'exact', head: true })
      .lt('last_activity', fiveMinutesAgo);

    return { 
      visitors: data || [], 
      total: count || 0,
      activeCount: activeCount || 0,
      inactiveCount: inactiveCount || 0
    };
  } catch (error) {
    visitorLogger.error('Error fetching visitors by status:', error);
    return { visitors: [], total: 0, activeCount: 0, inactiveCount: 0 };
  }
}

// Get page views (activity log) for a specific visitor
export async function getVisitorActivity(visitor_id: string): Promise<PageView[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('page_views')
      .select('*')
      .eq('visitor_id', visitor_id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      visitorLogger.error('Error fetching visitor activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    visitorLogger.error('Error fetching visitor activity:', error);
    return [];
  }
}

// Get all recent activities across all visitors
export async function getRecentActivities(limit: number = 100): Promise<(PageView & { visitor?: Visitor })[]> {
  try {
    const { data: pageViews, error } = await supabaseAdmin
      .from('page_views')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      visitorLogger.error('Error fetching recent activities:', error);
      return [];
    }

    // Get unique visitor IDs
    const visitorIds = [...new Set(pageViews?.map(pv => pv.visitor_id) || [])];
    
    // Fetch visitor data
    const { data: visitors } = await supabaseAdmin
      .from('visitors')
      .select('*')
      .in('visitor_id', visitorIds);

    const visitorMap = new Map(visitors?.map(v => [v.visitor_id, v]) || []);

    return (pageViews || []).map(pv => ({
      ...pv,
      visitor: visitorMap.get(pv.visitor_id)
    }));
  } catch (error) {
    visitorLogger.error('Error fetching recent activities:', error);
    return [];
  }
}

// Clear inactive visitors (older than specified hours)
export async function clearInactiveVisitors(hoursInactive: number = 24): Promise<{ deleted: number; error?: string }> {
  try {
    const cutoffTime = new Date(Date.now() - hoursInactive * 60 * 60 * 1000).toISOString();
    
    // First get the visitor_ids to delete
    const { data: visitorsToDelete } = await supabaseAdmin
      .from('visitors')
      .select('visitor_id')
      .lt('last_activity', cutoffTime);

    if (!visitorsToDelete || visitorsToDelete.length === 0) {
      return { deleted: 0 };
    }

    const visitorIds = visitorsToDelete.map(v => v.visitor_id);

    // Delete page views for these visitors
    await supabaseAdmin
      .from('page_views')
      .delete()
      .in('visitor_id', visitorIds);

    // Delete the visitors
    const { error } = await supabaseAdmin
      .from('visitors')
      .delete()
      .lt('last_activity', cutoffTime);

    if (error) {
      visitorLogger.error('Error clearing inactive visitors:', error);
      return { deleted: 0, error: error.message };
    }

    return { deleted: visitorsToDelete.length };
  } catch (error) {
    visitorLogger.error('Error clearing inactive visitors:', error);
    return { deleted: 0, error: 'Failed to clear inactive visitors' };
  }
}

// Delete a single visitor and their data
export async function deleteVisitor(id: string): Promise<boolean> {
  try {
    // Get the visitor_id first
    const { data: visitor } = await supabaseAdmin
      .from('visitors')
      .select('visitor_id')
      .eq('id', id)
      .single();

    if (visitor) {
      // Delete page views
      await supabaseAdmin
        .from('page_views')
        .delete()
        .eq('visitor_id', visitor.visitor_id);
    }

    // Delete the visitor
    const { error } = await supabaseAdmin
      .from('visitors')
      .delete()
      .eq('id', id);

    if (error) {
      visitorLogger.error('Error deleting visitor:', error);
      return false;
    }

    return true;
  } catch (error) {
    visitorLogger.error('Error deleting visitor:', error);
    return false;
  }
}


