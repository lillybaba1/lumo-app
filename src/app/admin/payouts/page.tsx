'use client';

import { useState, useEffect, useTransition } from 'react';
import {
  DollarSign,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  RefreshCw,
  Search,
  Banknote,
  Smartphone,
  AlertCircle,
  History,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { formatAmount } from '@/lib/currency';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SellerEarnings {
  sellerId: string;
  boutiqueId?: string;
  businessName: string;
  contactEmail: string;
  subscriptionTier: string;
  commissionRate: number;
  grossSales: number;
  commission: number;
  netEarnings: number;
  orderCount: number;
  itemCount: number;
  totalPaidOut: number;
  pendingPayout: number;
  payoutMethod?: string;
  mobileMoneyAccounts?: Array<{
    provider: string;
    number: string;
    accountName: string;
  }>;
  payoutDetails?: Record<string, unknown>;
}

interface PayoutRecord {
  id: string;
  sellerId: string;
  boutiqueId?: string;
  businessName: string;
  amount: number;
  commission: number;
  payoutMethod: string;
  status: string;
  transferId?: string;
  notes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
}

interface PayoutStats {
  totalPaidOut: number;
  totalCommissionEarned: number;
  pendingPayouts: number;
  sellerCount: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const tierBadgeColor: Record<string, string> = {
  free: 'bg-gray-100 text-gray-800',
  pro: 'bg-blue-100 text-blue-800',
  enterprise: 'bg-purple-100 text-purple-800',
};

const tierLabel: Record<string, string> = {
  free: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

function getPayoutMethodDisplay(seller: SellerEarnings): string {
  if (seller.mobileMoneyAccounts && seller.mobileMoneyAccounts.length > 0) {
    const primary = seller.mobileMoneyAccounts[0];
    return `${primary.provider} (${primary.number})`;
  }
  if (seller.payoutMethod) {
    return seller.payoutMethod.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  return 'Not set';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminPayoutsPage() {
  const [earnings, setEarnings] = useState<SellerEarnings[]>([]);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState<SellerEarnings | null>(null);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [selectedMobileAccount, setSelectedMobileAccount] = useState<{ provider: string; number: string; accountName: string } | null>(null);
  const [payoutNotes, setPayoutNotes] = useState('');
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [earningsRes, historyRes] = await Promise.all([
        fetch('/api/admin/payouts?view=earnings'),
        fetch('/api/admin/payouts?view=history'),
      ]);

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setEarnings(data.earnings || []);
        setStats(data.stats || null);
      }

      if (historyRes.ok) {
        const data = await historyRes.json();
        setHistory(data.records || []);
      }
    } catch (error) {
      console.error('Failed to load payout data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payout data',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handlePayoutClick = (seller: SellerEarnings) => {
    setSelectedSeller(seller);
    // Pre-fill payout method with first mobile money account if available
    if (seller.mobileMoneyAccounts && seller.mobileMoneyAccounts.length > 0) {
      const primary = seller.mobileMoneyAccounts[0];
      setPayoutMethod(primary.provider.toLowerCase());
      setSelectedMobileAccount(primary);
    } else if (seller.payoutMethod) {
      setPayoutMethod(seller.payoutMethod);
      setSelectedMobileAccount(null);
    } else {
      setPayoutMethod('manual');
      setSelectedMobileAccount(null);
    }
    setPayoutNotes('');
    setPayoutDialogOpen(true);
  };

  const handleProcessPayout = async () => {
    if (!selectedSeller) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/admin/payouts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sellerId: selectedSeller.sellerId,
            amount: selectedSeller.pendingPayout,
            commission: selectedSeller.commission,
            payoutMethod,
            notes: payoutNotes,
            mobileMoneyAccount: selectedMobileAccount || undefined,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          toast({
            title: data.transferId ? 'Payout Initiated via Modem Pay' : 'Payout Recorded',
            description: data.message || `${formatAmount(selectedSeller.pendingPayout)} GMD sent to ${selectedSeller.businessName}`,
          });
          setPayoutDialogOpen(false);
          setSelectedSeller(null);
          setSelectedMobileAccount(null);
          await loadData();
        } else {
          toast({
            title: 'Payout Failed',
            description: data.error || 'Failed to process payout',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to process payout:', error);
        toast({
          title: 'Error',
          description: 'Network error processing payout',
          variant: 'destructive',
        });
      }
    });
  };

  // Filter sellers based on search
  const filteredEarnings = earnings.filter(
    (s) =>
      s.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.contactEmail.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sellers with pending payouts
  const pendingSellers = filteredEarnings.filter((s) => s.pendingPayout > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Seller Payouts</h1>
          <p className="text-muted-foreground">
            Manage seller earnings and process payouts
          </p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatAmount(stats.pendingPayouts)} GMD
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingSellers.length} seller{pendingSellers.length !== 1 ? 's' : ''} waiting
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(stats.totalPaidOut)} GMD
              </div>
              <p className="text-xs text-muted-foreground">Lifetime payouts</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatAmount(stats.totalCommissionEarned)} GMD
              </div>
              <p className="text-xs text-muted-foreground">Platform revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">Active Sellers</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.sellerCount}</div>
              <p className="text-xs text-muted-foreground">With sales</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4" />
            Seller Earnings
            {pendingSellers.length > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0">
                {pendingSellers.length}
              </Badge>
            )}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Payout History
          </div>
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sellers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-3" />
          <p>Loading payout data...</p>
        </div>
      ) : activeTab === 'pending' ? (
        /* ─── Seller Earnings Table ─── */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Seller Earnings Breakdown
            </CardTitle>
            <CardDescription>
              All sellers with sales from delivered/paid orders. Commission auto-calculated by subscription tier.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredEarnings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No seller earnings yet</p>
                <p className="text-sm">Earnings appear when orders are delivered or paid</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead className="text-right">Gross Sales</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">Net Earnings</TableHead>
                      <TableHead className="text-right">Paid Out</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Payout Method</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEarnings.map((seller) => (
                      <TableRow key={seller.sellerId}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{seller.businessName}</p>
                            <p className="text-xs text-muted-foreground">{seller.contactEmail}</p>
                            <p className="text-xs text-muted-foreground">
                              {seller.orderCount} order{seller.orderCount !== 1 ? 's' : ''} · {seller.itemCount} item{seller.itemCount !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tierBadgeColor[seller.subscriptionTier] || tierBadgeColor.free}`}>
                            {tierLabel[seller.subscriptionTier] || 'Starter'}
                            <span className="ml-1 opacity-75">({seller.commissionRate}%)</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatAmount(seller.grossSales)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          -{formatAmount(seller.commission)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium">
                          {formatAmount(seller.netEarnings)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatAmount(seller.totalPaidOut)}
                        </TableCell>
                        <TableCell className="text-right">
                          {seller.pendingPayout > 0 ? (
                            <span className="font-mono font-bold text-orange-600">
                              {formatAmount(seller.pendingPayout)}
                            </span>
                          ) : (
                            <span className="text-green-600 text-sm">All paid ✓</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {seller.mobileMoneyAccounts && seller.mobileMoneyAccounts.length > 0 ? (
                              <>
                                <Smartphone className="h-3.5 w-3.5 text-green-600" />
                                <span className="text-xs">{getPayoutMethodDisplay(seller)}</span>
                              </>
                            ) : seller.payoutMethod ? (
                              <span className="text-xs">{getPayoutMethodDisplay(seller)}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                Not set
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {seller.pendingPayout > 0 ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayoutClick(seller)}
                              disabled={isPending}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                              Mark Paid
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" disabled>
                              Paid
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        /* ─── Payout History Table ─── */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Payout History
            </CardTitle>
            <CardDescription>
              Record of all processed payouts to sellers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No payouts processed yet</p>
                <p className="text-sm">Payout records will appear here after processing</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history
                      .filter(
                        (r) =>
                          r.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.sellerId.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((record) => (
                        <TableRow key={record.id}>
                          <TableCell className="text-sm">
                            {record.processedAt
                              ? new Date(record.processedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : new Date(record.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {record.businessName || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-green-600">
                            {formatAmount(record.amount)} GMD
                          </TableCell>
                          <TableCell className="text-right font-mono text-muted-foreground">
                            {formatAmount(record.commission)} GMD
                          </TableCell>
                          <TableCell className="text-sm">
                            {record.payoutMethod || 'Manual'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                record.status === 'completed'
                                  ? 'default'
                                  : record.status === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                              className={
                                record.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : ''
                              }
                            >
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                            {record.notes || '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Process Payout Dialog ─── */}
      <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Confirm payout to <strong>{selectedSeller?.businessName}</strong>
            </DialogDescription>
          </DialogHeader>

          {selectedSeller && (
            <div className="space-y-4">
              {/* Payout Summary */}
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Gross Sales</span>
                  <span className="font-mono">{formatAmount(selectedSeller.grossSales)} GMD</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Commission ({selectedSeller.commissionRate}%)
                  </span>
                  <span className="font-mono text-orange-600">
                    -{formatAmount(selectedSeller.commission)} GMD
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Already Paid</span>
                  <span className="font-mono text-green-600">
                    -{formatAmount(selectedSeller.totalPaidOut)} GMD
                  </span>
                </div>
                <hr />
                <div className="flex justify-between font-medium">
                  <span>Amount to Pay</span>
                  <span className="font-mono text-lg">
                    {formatAmount(selectedSeller.pendingPayout)} GMD
                  </span>
                </div>
              </div>

              {/* Mobile Money Accounts — select to send via Modem Pay */}
              {selectedSeller.mobileMoneyAccounts &&
                selectedSeller.mobileMoneyAccounts.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Send to Mobile Money (via Modem Pay)</label>
                    <p className="text-xs text-muted-foreground">Select an account to send money directly via Modem Pay</p>
                    {selectedSeller.mobileMoneyAccounts.map((acc, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer transition-colors ${
                          selectedMobileAccount?.number === acc.number && selectedMobileAccount?.provider === acc.provider
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedMobileAccount(acc);
                          setPayoutMethod(acc.provider.toLowerCase());
                        }}
                      >
                        <Smartphone className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{acc.provider}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-mono">{acc.number}</span>
                        <span className="text-muted-foreground">({acc.accountName})</span>
                        {selectedMobileAccount?.number === acc.number && selectedMobileAccount?.provider === acc.provider && (
                          <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                        )}
                      </div>
                    ))}
                    {/* Option to mark as manual instead */}
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground underline mt-1"
                      onClick={() => {
                        setSelectedMobileAccount(null);
                        setPayoutMethod('manual');
                      }}
                    >
                      Or mark as manual/external payout
                    </button>
                  </div>
                )}

              {/* Manual payout method (when no mobile money or choosing manual) */}
              {(!selectedSeller.mobileMoneyAccounts || selectedSeller.mobileMoneyAccounts.length === 0 || !selectedMobileAccount) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Payment Method Used</label>
                  <Select value={payoutMethod} onValueChange={(v) => { setPayoutMethod(v); setSelectedMobileAccount(null); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wave">Wave</SelectItem>
                      <SelectItem value="qmoney">QMoney</SelectItem>
                      <SelectItem value="afrimoney">Afrimoney</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="manual">Manual / Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  placeholder="Transaction reference, receipt number, etc."
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Info banner about Modem Pay */}
              {selectedMobileAccount && (
                <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Smartphone className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    <strong>Modem Pay Transfer:</strong> Clicking confirm will send{' '}
                    <strong>{formatAmount(selectedSeller.pendingPayout)} GMD</strong> directly to{' '}
                    <strong>{selectedMobileAccount.accountName}</strong>&apos;s{' '}
                    <strong>{selectedMobileAccount.provider}</strong> account ({selectedMobileAccount.number}).
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayout}
              disabled={isPending || !selectedSeller || selectedSeller.pendingPayout <= 0}
              className={selectedMobileAccount ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {selectedMobileAccount ? 'Sending...' : 'Processing...'}
                </>
              ) : selectedMobileAccount ? (
                <>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Send via Modem Pay
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
