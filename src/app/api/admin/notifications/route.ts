import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, UnauthorizedError } from '@/lib/auth-admin';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { logger } from '@/lib/logger';

const apiLogger = logger.child('API:AdminNotifications');

export async function GET(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });

    // Get unread notifications
    const { data: notifications, error } = await supabaseAdmin
      .from('admin_notifications')
      .select(`
        *,
        business_accounts (
          id,
          business_name,
          contact_email
        )
      `)
      .eq('is_read', false)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      // Table might not exist yet
      apiLogger.debug('Notifications fetch error', { error: error.message });
      return NextResponse.json({ notifications: [] });
    }

    return NextResponse.json({ notifications: notifications || [] });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Notifications error', error as Error);
    return NextResponse.json({ notifications: [] });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin({ redirect: false });

    const { notificationId, markAllRead } = await request.json();

    if (markAllRead) {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('is_read', false);
    } else if (notificationId) {
      await supabaseAdmin
        .from('admin_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    apiLogger.error('Mark read error', error as Error);
    return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
  }
}
