import { requireBusiness } from '@/lib/auth-business';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, TrendingUp, DollarSign, ArrowUpRight, ArrowDownRight,
  Clock, CheckCircle, AlertCircle, CreditCard
} from 'lucide-react';
import Link from 'next/link';
import { SUBSCRIPTION_TIERS } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function EarningsPage() {
  const { businessAccount } = await requireBusiness();
  
  const tier = businessAccount.subscriptionTier || 'free';
  const tierDetails = SUBSCRIPTION_TIERS[tier as keyof typeof SUBSCRIPTION_TIERS];
  const commissionRate = tierDetails?.commissionRate || 15;

  // Fetch earnings data
  const { data: transactions } = await supabaseAdmin
    .from('seller_transactions')
    .select('*')
    .eq('business_account_id', businessAccount.id)
    .order('created_at', { ascending: false })
    .limit(20);

  // Fetch pending payouts
  const { data: pendingPayouts } = await supabaseAdmin
    .from('seller_payouts')
    .select('*')
    .eq('business_account_id', businessAccount.id)
    .eq('status', 'pending');

  const totalEarnings = businessAccount.totalEarnings || 0;
  const totalCommission = businessAccount.totalCommissionPaid || 0;
  const pendingPayout = businessAccount.pendingPayout || 0;

  // Calculate this month's earnings
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthTransactions = transactions?.filter(t => 
    new Date(t.created_at) >= startOfMonth && t.type === 'sale'
  ) || [];
  const thisMonthEarnings = thisMonthTransactions.reduce((sum, t) => sum + (t.net_amount || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <Wallet className="h-8 w-8" />
            Earnings
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your revenue and payouts
          </p>
        </div>
        <Button asChild>
          <Link href="/business/payout">
            <CreditCard className="h-4 w-4 mr-2" />
            Payout Settings
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Earnings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">After commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${thisMonthEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{thisMonthTransactions.length} sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending Payout
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${pendingPayout.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Available for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Commission Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{commissionRate}% rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Commission Info */}
      <Card className="mb-6 bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">Your Commission Rate: {commissionRate}%</p>
                <p className="text-sm text-muted-foreground">
                  {tier === 'free' ? 'Upgrade to Pro to reduce your rate to 10%' : 
                   tier === 'pro' ? 'Upgrade to Enterprise for only 5% commission' : 
                   'You have the lowest commission rate!'}
                </p>
              </div>
            </div>
            {tier !== 'enterprise' && (
              <Button variant="outline" size="sm" asChild>
                <Link href="/business/subscription">Reduce Rate</Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your latest sales and payouts</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions && transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.slice(0, 10).map((transaction) => (
                  <div 
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        transaction.type === 'sale' ? 'bg-green-100 dark:bg-green-900' :
                        transaction.type === 'payout' ? 'bg-blue-100 dark:bg-blue-900' :
                        transaction.type === 'refund' ? 'bg-red-100 dark:bg-red-900' :
                        'bg-gray-100 dark:bg-gray-900'
                      }`}>
                        {transaction.type === 'sale' && <ArrowUpRight className="h-4 w-4 text-green-600" />}
                        {transaction.type === 'payout' && <ArrowDownRight className="h-4 w-4 text-blue-600" />}
                        {transaction.type === 'refund' && <ArrowDownRight className="h-4 w-4 text-red-600" />}
                        {transaction.type === 'commission' && <DollarSign className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div>
                        <p className="font-medium capitalize">{transaction.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${
                        transaction.type === 'sale' ? 'text-green-600' :
                        transaction.type === 'refund' ? 'text-red-600' : ''
                      }`}>
                        {transaction.type === 'refund' ? '-' : '+'}${Math.abs(transaction.net_amount || transaction.amount).toFixed(2)}
                      </p>
                      {transaction.commission_amount && (
                        <p className="text-xs text-muted-foreground">
                          -{transaction.commission_amount.toFixed(2)} commission
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No transactions yet</p>
                <p className="text-sm">Start selling to see your earnings here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payout History */}
        <Card>
          <CardHeader>
            <CardTitle>Payout Requests</CardTitle>
            <CardDescription>Your withdrawal history</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingPayouts && pendingPayouts.length > 0 ? (
              <div className="space-y-3">
                {pendingPayouts.map((payout) => (
                  <div 
                    key={payout.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                        <Clock className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-medium">${payout.amount.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payout.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {payout.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No pending payouts</p>
                {pendingPayout > 0 && (
                  <Button className="mt-4" size="sm" asChild>
                    <Link href="/business/payout/request">Request Payout</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
