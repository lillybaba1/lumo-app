'use server';

import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/types';
import { getAllBusinessAccounts, updateBusinessAccount } from './businessAccountService';
import { getOrders } from './orderService';

const payoutLogger = logger.child('PayoutService');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SellerEarnings {
  sellerId: string;          // business_account.id
  businessName: string;
  contactEmail: string;
  subscriptionTier: SubscriptionTier;
  commissionRate: number;    // percentage e.g. 15
  // Aggregated from orders
  grossSales: number;        // total item revenue for this seller
  commission: number;        // platform's cut
  netEarnings: number;       // what seller should receive
  orderCount: number;        // number of orders with this seller's items
  itemCount: number;         // total items sold
  // From business_account
  totalPaidOut: number;      // lifetime payouts already sent
  pendingPayout: number;     // what's still owed
  // Payout method info
  payoutMethod?: string;
  mobileMoneyAccounts?: Array<{
    provider: string;
    number: string;
    accountName: string;
  }>;
  payoutDetails?: Record<string, unknown>;
}

export interface PayoutRecord {
  id: string;
  sellerId: string;
  businessName: string;
  amount: number;
  commission: number;
  payoutMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

// ─── Seller Earnings Calculation ─────────────────────────────────────────────

/**
 * Calculate earnings for all sellers based on delivered/paid orders.
 * Groups order items by sellerId, applies commission based on seller's subscription tier.
 */
export async function calculateAllSellerEarnings(): Promise<SellerEarnings[]> {
  try {
    // Fetch all orders and business accounts in parallel
    const [orders, businessAccounts] = await Promise.all([
      getOrders(),
      getAllBusinessAccounts(),
    ]);

    // Build a map of business accounts by ID AND by ownerUserId
    const accountById = new Map(businessAccounts.map(ba => [ba.id, ba]));
    const accountByOwnerId = new Map(businessAccounts.map(ba => [ba.ownerUserId, ba]));

    // Only count orders that are Delivered or have Paid payment status
    const eligibleOrders = orders.filter(
      (order) => order.status === 'Delivered' || order.paymentStatus === 'Paid'
    );

    // Aggregate earnings by seller
    const sellerMap = new Map<string, {
      grossSales: number;
      commission: number;
      netEarnings: number;
      orderIds: Set<string>;
      itemCount: number;
    }>();

    for (const order of eligibleOrders) {
      if (!order.items || order.items.length === 0) continue;

      for (const item of order.items) {
        const sellerId = item.sellerId;
        if (!sellerId) continue;

        // Look up the business account - sellerId might be business account ID or user ID
        const account = accountById.get(sellerId) || accountByOwnerId.get(sellerId);
        if (!account) {
          payoutLogger.warn('Seller not found for item', { sellerId, orderId: order.id });
          continue;
        }

        const tier = account.subscriptionTier || 'free';
        const commissionRate = SUBSCRIPTION_TIERS[tier]?.commissionRate ?? 15;

        const itemTotal = (item.product?.price || 0) * (item.quantity || 1);
        const itemCommission = (itemTotal * commissionRate) / 100;
        const itemNet = itemTotal - itemCommission;

        const existing = sellerMap.get(account.id) || {
          grossSales: 0,
          commission: 0,
          netEarnings: 0,
          orderIds: new Set<string>(),
          itemCount: 0,
        };

        existing.grossSales += itemTotal;
        existing.commission += itemCommission;
        existing.netEarnings += itemNet;
        existing.orderIds.add(order.id);
        existing.itemCount += item.quantity || 1;

        sellerMap.set(account.id, existing);
      }
    }

    // Build result array
    const results: SellerEarnings[] = [];

    for (const [accountId, stats] of sellerMap.entries()) {
      const account = accountById.get(accountId);
      if (!account) continue;

      const tier = account.subscriptionTier || 'free';
      const commissionRate = SUBSCRIPTION_TIERS[tier]?.commissionRate ?? 15;
      const totalPaidOut = account.totalEarnings || 0; // lifetime paid
      const pending = Math.max(0, stats.netEarnings - totalPaidOut);

      results.push({
        sellerId: account.id,
        businessName: account.businessName,
        contactEmail: account.contactEmail,
        subscriptionTier: tier,
        commissionRate,
        grossSales: Math.round(stats.grossSales * 100) / 100,
        commission: Math.round(stats.commission * 100) / 100,
        netEarnings: Math.round(stats.netEarnings * 100) / 100,
        orderCount: stats.orderIds.size,
        itemCount: stats.itemCount,
        totalPaidOut: Math.round(totalPaidOut * 100) / 100,
        pendingPayout: Math.round(pending * 100) / 100,
        payoutMethod: account.payoutMethod,
        mobileMoneyAccounts: account.mobileMoneyAccounts,
        payoutDetails: account.payoutDetails,
      });
    }

    // Sort by pending payout descending
    results.sort((a, b) => b.pendingPayout - a.pendingPayout);

    return results;
  } catch (error) {
    payoutLogger.error('Failed to calculate seller earnings:', error);
    return [];
  }
}

// ─── Payout Records (persisted in DB) ────────────────────────────────────────

/**
 * Verify seller_payouts table is accessible.
 */
async function ensurePayoutsTable(): Promise<void> {
  // Table already exists from 20251202_boutique_system migration
  // Uses business_account_id as the seller reference column
  return;
}

/**
 * Get all payout records
 */
export async function getPayoutRecords(): Promise<PayoutRecord[]> {
  try {
    await ensurePayoutsTable();

    const { data, error } = await supabaseAdmin
      .from('seller_payouts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      // If table doesn't exist, return empty array
      if (error.code === '42P01') return [];
      payoutLogger.error('Error fetching payout records:', error);
      return [];
    }

    return (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      sellerId: row.business_account_id as string,
      businessName: (row.business_name as string) || '',
      amount: parseFloat(String(row.amount)) || 0,
      commission: parseFloat(String(row.commission)) || 0,
      payoutMethod: (row.payout_method as string) || '',
      status: (row.status as PayoutRecord['status']) || 'pending',
      notes: (row.notes as string) || undefined,
      processedBy: (row.processed_by as string) || undefined,
      processedAt: (row.processed_at as string) || undefined,
      createdAt: row.created_at as string,
    }));
  } catch (error) {
    payoutLogger.error('Failed to fetch payout records:', error);
    return [];
  }
}

/**
 * Mark a seller payout as completed.
 * Creates a payout record and updates the seller's business account.
 */
export async function processSellerPayout(
  sellerId: string,
  amount: number,
  commission: number,
  payoutMethod: string,
  processedBy: string,
  notes?: string
): Promise<{ success: boolean; error?: string; payoutId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Payout amount must be greater than zero' };
    }

    await ensurePayoutsTable();

    // 1. Create payout record
    const { data: payoutData, error: payoutError } = await supabaseAdmin
      .from('seller_payouts')
      .insert({
        business_account_id: sellerId,
        business_name: '',
        amount,
        commission,
        payout_method: payoutMethod,
        status: 'completed',
        notes: notes || `Payout processed via ${payoutMethod}`,
        processed_by: processedBy,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (payoutError) {
      // If table doesn't exist, still update the business account
      if (payoutError.code !== '42P01') {
        payoutLogger.error('Error creating payout record:', payoutError);
      }
    }

    // 2. Update business account — increase totalEarnings (lifetime paid) and reset pendingPayout
    const { data: accountData } = await supabaseAdmin
      .from('business_accounts')
      .select('total_earnings, total_commission_paid, business_name')
      .eq('id', sellerId)
      .single();

    const currentPaid = parseFloat(String(accountData?.total_earnings)) || 0;
    const currentCommission = parseFloat(String(accountData?.total_commission_paid)) || 0;

    // Update the payout record with business name
    if (payoutData?.id && accountData?.business_name) {
      await supabaseAdmin
        .from('seller_payouts')
        .update({ business_name: accountData.business_name })
        .eq('id', payoutData.id);
    }

    const updated = await updateBusinessAccount(sellerId, {
      totalEarnings: currentPaid + amount,
      totalCommissionPaid: currentCommission + commission,
      pendingPayout: 0,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update seller account' };
    }

    payoutLogger.info('Payout processed', {
      sellerId,
      amount,
      commission,
      payoutMethod,
      processedBy,
    });

    return {
      success: true,
      payoutId: payoutData?.id,
    };
  } catch (error) {
    payoutLogger.error('Failed to process payout:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Get payout summary stats for the admin dashboard
 */
export async function getPayoutStats(): Promise<{
  totalPaidOut: number;
  totalCommissionEarned: number;
  pendingPayouts: number;
  sellerCount: number;
}> {
  try {
    const earnings = await calculateAllSellerEarnings();

    const totalPaidOut = earnings.reduce((sum, s) => sum + s.totalPaidOut, 0);
    const totalCommission = earnings.reduce((sum, s) => sum + s.commission, 0);
    const pendingPayouts = earnings.reduce((sum, s) => sum + s.pendingPayout, 0);
    const sellerCount = earnings.filter(s => s.grossSales > 0).length;

    return {
      totalPaidOut: Math.round(totalPaidOut * 100) / 100,
      totalCommissionEarned: Math.round(totalCommission * 100) / 100,
      pendingPayouts: Math.round(pendingPayouts * 100) / 100,
      sellerCount,
    };
  } catch (error) {
    payoutLogger.error('Failed to get payout stats:', error);
    return { totalPaidOut: 0, totalCommissionEarned: 0, pendingPayouts: 0, sellerCount: 0 };
  }
}
