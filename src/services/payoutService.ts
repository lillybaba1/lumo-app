'use server';

import { logger } from '@/lib/logger';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Order, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/lib/types';
import { getAllBusinessAccounts, updateBusinessAccount } from './businessAccountService';
import { getOrders } from './orderService';
import { initiateModemPayTransfer } from '@/lib/modempay';

const payoutLogger = logger.child('PayoutService');

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SellerEarnings {
  sellerId: string;          // business_account.id
  boutiqueId?: string;       // boutique.id (for DB operations)
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
  boutiqueId?: string;
  businessName: string;
  amount: number;
  commission: number;
  payoutMethod: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  transferId?: string;       // Modem Pay transfer ID
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

// Map mobile money provider names to Modem Pay network identifiers
const PROVIDER_TO_NETWORK: Record<string, 'afrimoney' | 'qmoney' | 'wave'> = {
  'Afrimoney': 'afrimoney',
  'afrimoney': 'afrimoney',
  'QMoney': 'qmoney',
  'qmoney': 'qmoney',
  'Wave': 'wave',
  'wave': 'wave',
};

// Map payout method strings to valid DB values (DB CHECK allows: bank, paypal, stripe, manual)
function toDbPayoutMethod(method: string): string {
  const lower = method.toLowerCase();
  if (['bank', 'bank_transfer'].includes(lower)) return 'bank';
  if (lower === 'paypal') return 'paypal';
  if (lower === 'stripe') return 'stripe';
  // All mobile money methods stored as 'manual' in DB since CHECK constraint is limited
  return 'manual';
}

// ─── Seller Earnings Calculation ─────────────────────────────────────────────

/**
 * Calculate earnings for all sellers based on delivered/paid orders.
 * Groups order items by sellerId, applies commission based on seller's subscription tier.
 */
export async function calculateAllSellerEarnings(): Promise<SellerEarnings[]> {
  try {
    // Fetch all orders, business accounts, and boutiques in parallel
    const [orders, businessAccounts] = await Promise.all([
      getOrders(),
      getAllBusinessAccounts(),
    ]);

    // Fetch boutiques to map business_account_id -> boutique_id
    const { data: boutiques } = await supabaseAdmin
      .from('boutiques')
      .select('id, business_account_id');
    const boutiqueByAccountId = new Map(
      (boutiques || []).map((b: any) => [b.business_account_id, b.id])
    );

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
        boutiqueId: boutiqueByAccountId.get(account.id),
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
      sellerId: (row.boutique_id as string) || '',
      boutiqueId: row.boutique_id as string,
      businessName: (row.business_name as string) || '',
      amount: parseFloat(String(row.amount)) || 0,
      commission: parseFloat(String(row.commission)) || 0,
      payoutMethod: (row.payout_method as string) || '',
      status: (row.status as PayoutRecord['status']) || 'pending',
      transferId: (row.transaction_id as string) || undefined,
      notes: (row.notes as string) || undefined,
      processedBy: (row.processed_by as string) || undefined,
      processedAt: (row.processed_date as string) || undefined,
      createdAt: row.created_at as string,
    }));
  } catch (error) {
    payoutLogger.error('Failed to fetch payout records:', error);
    return [];
  }
}

/**
 * Mark a seller payout as completed.
 * If the seller has mobile money accounts and method is a mobile money provider,
 * it will initiate a Modem Pay transfer. Otherwise, records as manual payout.
 */
export async function processSellerPayout(
  sellerId: string,
  amount: number,
  commission: number,
  payoutMethod: string,
  processedBy: string,
  notes?: string,
  mobileMoneyAccount?: { provider: string; number: string; accountName: string }
): Promise<{ success: boolean; error?: string; payoutId?: string; transferId?: string }> {
  try {
    if (amount <= 0) {
      return { success: false, error: 'Payout amount must be greater than zero' };
    }

    await ensurePayoutsTable();

    // Look up the boutique ID for this seller (business account)
    const { data: boutique } = await supabaseAdmin
      .from('boutiques')
      .select('id')
      .eq('business_account_id', sellerId)
      .single();

    const boutiqueId = boutique?.id;
    if (!boutiqueId) {
      payoutLogger.warn('No boutique found for seller, using seller ID', { sellerId });
    }

    // Get business account info
    const { data: accountData } = await supabaseAdmin
      .from('business_accounts')
      .select('total_earnings, total_commission_paid, business_name, mobile_money_accounts')
      .eq('id', sellerId)
      .single();

    const businessName = accountData?.business_name || '';

    // Determine if we should send via Modem Pay
    const network = PROVIDER_TO_NETWORK[payoutMethod] || PROVIDER_TO_NETWORK[mobileMoneyAccount?.provider || ''];
    let transferId: string | undefined;
    let payoutStatus: 'pending' | 'processing' | 'completed' = 'completed';

    if (network && mobileMoneyAccount) {
      // Initiate Modem Pay transfer to seller's mobile money account
      payoutLogger.info('Initiating Modem Pay transfer', {
        sellerId,
        network,
        amount,
        accountNumber: mobileMoneyAccount.number,
      });

      const transferResult = await initiateModemPayTransfer({
        amount,
        network,
        accountNumber: mobileMoneyAccount.number,
        beneficiaryName: mobileMoneyAccount.accountName,
        sellerId,
        narration: `Payout to ${businessName} - ${mobileMoneyAccount.provider}`,
      });

      if (transferResult.success) {
        transferId = transferResult.transferId;
        payoutStatus = 'processing'; // Will be updated to 'completed' via webhook
        payoutLogger.info('Modem Pay transfer initiated', { transferId, status: transferResult.status });
      } else {
        payoutLogger.error('Modem Pay transfer failed', { error: transferResult.error });
        return { success: false, error: `Mobile money transfer failed: ${transferResult.error}` };
      }
    }

    // 1. Create payout record using correct column names (boutique_id, not business_account_id)
    const dbMethod = toDbPayoutMethod(payoutMethod);
    const { data: payoutData, error: payoutError } = await supabaseAdmin
      .from('seller_payouts')
      .insert({
        boutique_id: boutiqueId || sellerId,
        amount,
        currency: 'GMD',
        payout_method: dbMethod,
        status: payoutStatus,
        transaction_id: transferId || null,
        notes: notes || `Payout via ${payoutMethod}${transferId ? ` (Transfer: ${transferId})` : ''}`,
        processed_by: processedBy,
        processed_date: payoutStatus === 'completed' ? new Date().toISOString() : null,
        business_name: businessName,
        commission,
      })
      .select()
      .single();

    if (payoutError) {
      payoutLogger.error('Error creating payout record:', payoutError);
      // If it was a Modem Pay transfer that already succeeded, we still need to track it
      if (transferId) {
        payoutLogger.warn('Modem Pay transfer was initiated but DB record failed', { transferId });
      }
    }

    // 2. Update business account — increase totalEarnings (lifetime paid) only if completed
    if (payoutStatus === 'completed') {
      const currentPaid = parseFloat(String(accountData?.total_earnings)) || 0;
      const currentCommission = parseFloat(String(accountData?.total_commission_paid)) || 0;

      const updated = await updateBusinessAccount(sellerId, {
        totalEarnings: currentPaid + amount,
        totalCommissionPaid: currentCommission + commission,
        pendingPayout: 0,
      });

      if (!updated) {
        payoutLogger.warn('Failed to update seller account totals', { sellerId });
      }
    }

    payoutLogger.info('Payout processed', {
      sellerId,
      amount,
      commission,
      payoutMethod,
      processedBy,
      transferId,
      status: payoutStatus,
    });

    return {
      success: true,
      payoutId: payoutData?.id,
      transferId,
    };
  } catch (error) {
    payoutLogger.error('Failed to process payout:', error);
    return { success: false, error: 'Internal server error' };
  }
}

/**
 * Update a payout record status (called from webhook when transfer completes/fails)
 */
export async function updatePayoutByTransferId(
  transferId: string,
  status: 'completed' | 'failed',
  failureReason?: string
): Promise<boolean> {
  try {
    // Find the payout record by transaction_id (transfer ID)
    const { data: payout, error: findError } = await supabaseAdmin
      .from('seller_payouts')
      .select('id, boutique_id, amount, commission, status')
      .eq('transaction_id', transferId)
      .single();

    if (findError || !payout) {
      payoutLogger.warn('No payout record found for transfer', { transferId });
      return false;
    }

    // Skip if already in final state
    if (payout.status === 'completed' || payout.status === 'failed') {
      payoutLogger.info('Payout already in final state, skipping', { transferId, status: payout.status });
      return true;
    }

    // Update payout record
    const updates: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };
    if (status === 'completed') {
      updates.processed_date = new Date().toISOString();
    }
    if (failureReason) {
      updates.failure_reason = failureReason;
    }

    const { error: updateError } = await supabaseAdmin
      .from('seller_payouts')
      .update(updates)
      .eq('id', payout.id);

    if (updateError) {
      payoutLogger.error('Failed to update payout record:', updateError);
      return false;
    }

    // If completed, update the seller's business account totals
    if (status === 'completed') {
      // Find business account from boutique
      const { data: boutique } = await supabaseAdmin
        .from('boutiques')
        .select('business_account_id')
        .eq('id', payout.boutique_id)
        .single();

      if (boutique?.business_account_id) {
        const { data: accountData } = await supabaseAdmin
          .from('business_accounts')
          .select('total_earnings, total_commission_paid')
          .eq('id', boutique.business_account_id)
          .single();

        const currentPaid = parseFloat(String(accountData?.total_earnings)) || 0;
        const currentCommission = parseFloat(String(accountData?.total_commission_paid)) || 0;
        const payoutAmount = parseFloat(String(payout.amount)) || 0;
        const payoutCommission = parseFloat(String(payout.commission)) || 0;

        await updateBusinessAccount(boutique.business_account_id, {
          totalEarnings: currentPaid + payoutAmount,
          totalCommissionPaid: currentCommission + payoutCommission,
          pendingPayout: 0,
        });

        payoutLogger.info('Seller account updated after transfer completion', {
          sellerId: boutique.business_account_id,
          amount: payoutAmount,
        });
      }
    }

    payoutLogger.info('Payout record updated via webhook', { transferId, status });
    return true;
  } catch (error) {
    payoutLogger.error('Failed to update payout by transfer ID:', error);
    return false;
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
