import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

/**
 * POST /api/admin/run-migration
 * One-time endpoint to run the escrow migration.
 * Admin-only. Delete this file after running.
 */
export async function POST() {
  try {
    // Verify admin
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!userData?.role || !['admin', 'APP_OWNER_ADMIN'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const results: string[] = [];

    // 1. Add columns to orders table
    const columns = [
      { name: 'confirmation_token', def: 'UUID DEFAULT NULL' },
      { name: 'payout_at', def: 'TIMESTAMPTZ DEFAULT NULL' },
      { name: 'auto_confirm_at', def: 'TIMESTAMPTZ DEFAULT NULL' },
      { name: 'seller_id', def: 'UUID DEFAULT NULL' },
    ];

    for (const col of columns) {
      const { error } = await supabaseAdmin.rpc('exec_sql_migration', {
        sql_text: `ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ${col.name} ${col.def}`,
      });
      if (error) {
        // RPC doesn't exist, try raw approach
        results.push(`Column ${col.name}: RPC not available (${error.message})`);
      } else {
        results.push(`Column ${col.name}: OK`);
      }
    }

    // 2. Check/create delivery_confirmations table
    const { error: tableCheck } = await supabaseAdmin
      .from('delivery_confirmations')
      .select('id')
      .limit(1);

    if (tableCheck) {
      results.push(`delivery_confirmations table: needs manual creation (${tableCheck.message})`);
    } else {
      results.push('delivery_confirmations table: already exists');
    }

    return NextResponse.json({
      message: 'Migration check complete',
      results,
      instructions: 'If any items show "needs manual creation", run migrations/020_escrow_system.sql in Supabase Dashboard SQL Editor',
      dashboardUrl: 'https://supabase.com/dashboard/project/edsuvnlbviosnyxbjptx/sql/new',
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
