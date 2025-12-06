'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  CreditCard,
  Building2,
  Plus,
  Settings,
  Download,
  RefreshCw,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import {
  getBalance,
  getEarnings,
  getPayouts,
  getPayoutAccounts,
  getPayoutSettings,
  createPayoutAccount,
  updatePayoutSettings,
  requestPayout,
  getCommissionTiers,
} from './actions';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface Balance {
  pending_balance: number;
  available_balance: number;
  total_earnings: number;
  total_paid: number;
  total_fees: number;
  last_payout_date?: string;
  next_payout_date?: string;
}

interface Earning {
  id: string;
  order_id: string;
  order_total: number;
  platform_fee: number;
  payment_processing_fee: number;
  net_earnings: number;
  status: 'pending' | 'available' | 'processing' | 'paid' | 'refunded';
  created_at: string;
}

interface Payout {
  id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payout_method: string;
  transaction_id?: string;
  processed_date?: string;
  created_at: string;
}

interface PayoutAccount {
  id: string;
  account_type: 'bank' | 'paypal' | 'stripe';
  account_name: string;
  is_primary: boolean;
  is_verified: boolean;
}

interface PayoutSettingsData {
  payout_frequency: string;
  payout_day?: number;
  minimum_payout: number;
  hold_period_days: number;
  auto_payout: boolean;
}

export default function PayoutsPage() {
  const { toast } = useToast();
  const [balance, setBalance] = useState<Balance | null>(null);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [settings, setSettings] = useState<PayoutSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    const [balanceRes, earningsRes, payoutsRes, accountsRes, settingsRes] = await Promise.all([
      getBalance(),
      getEarnings(),
      getPayouts(),
      getPayoutAccounts(),
      getPayoutSettings(),
    ]);

    if (balanceRes.success) setBalance(balanceRes.data);
    if (earningsRes.success) setEarnings(earningsRes.data || []);
    if (payoutsRes.success) setPayouts(payoutsRes.data || []);
    if (accountsRes.success) setAccounts(accountsRes.data || []);
    if (settingsRes.success) setSettings(settingsRes.data);
    
    setLoading(false);
  }

  async function handleRequestPayout() {
    if (!balance || balance.available_balance <= 0) {
      toast({ title: 'Error', description: 'No available balance to withdraw', variant: 'destructive' });
      return;
    }

    const primaryAccount = accounts.find(a => a.is_primary && a.is_verified);
    if (!primaryAccount) {
      toast({ title: 'Error', description: 'Please add and verify a payout account first', variant: 'destructive' });
      return;
    }

    setRequestingPayout(true);
    const result = await requestPayout(balance.available_balance);
    if (result.success) {
      toast({ title: 'Payout requested successfully' });
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setRequestingPayout(false);
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      available: 'default',
      processing: 'outline',
      completed: 'default',
      paid: 'default',
      failed: 'destructive',
      cancelled: 'destructive',
      refunded: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payouts & Earnings</h1>
          <p className="text-muted-foreground">
            Manage your earnings and payout settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button 
            onClick={handleRequestPayout}
            disabled={requestingPayout || !balance || balance.available_balance <= 0}
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Request Payout
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(balance?.available_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Ready for withdrawal</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(balance?.pending_balance || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {settings?.hold_period_days || 7} day hold period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(balance?.total_earnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Paid Out</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(balance?.total_paid || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {balance?.last_payout_date && `Last: ${formatDistanceToNow(new Date(balance.last_payout_date), { addSuffix: true })}`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payout Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payout Accounts</CardTitle>
              <CardDescription>Where your earnings will be sent</CardDescription>
            </div>
            <Button variant="outline" onClick={() => setShowAddAccount(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Account
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {accounts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
              <CreditCard className="h-8 w-8 mb-2" />
              <p>No payout accounts configured</p>
              <Button variant="link" onClick={() => setShowAddAccount(true)}>
                Add your first account
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {account.account_type === 'bank' ? (
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">{account.account_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {account.account_type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {account.is_primary && (
                      <Badge variant="secondary">Primary</Badge>
                    )}
                    {account.is_verified ? (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs for Earnings & Payouts */}
      <Tabs defaultValue="earnings">
        <TabsList>
          <TabsTrigger value="earnings">Earnings History</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Earnings</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Order Total</TableHead>
                    <TableHead>Platform Fee</TableHead>
                    <TableHead>Net Earnings</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No earnings yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    earnings.map((earning) => (
                      <TableRow key={earning.id}>
                        <TableCell>
                          {format(new Date(earning.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {earning.order_id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{formatCurrency(earning.order_total)}</TableCell>
                        <TableCell className="text-destructive">
                          -{formatCurrency(earning.platform_fee + (earning.payment_processing_fee || 0))}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(earning.net_earnings)}
                        </TableCell>
                        <TableCell>{getStatusBadge(earning.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Payout History</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No payouts yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    payouts.map((payout) => (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {format(new Date(payout.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(payout.amount)}
                        </TableCell>
                        <TableCell className="capitalize">{payout.payout_method}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {payout.transaction_id || '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Account Dialog - simplified for demo */}
      <Dialog open={showAddAccount} onOpenChange={setShowAddAccount}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payout Account</DialogTitle>
            <DialogDescription>
              Add a bank account or payment method to receive payouts.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Account Type</Label>
              <Select defaultValue="bank">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank Account</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input placeholder="e.g., My Business Checking" />
            </div>
            <p className="text-sm text-muted-foreground">
              Additional account details would be collected based on the account type.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAccount(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: 'Account added - verification pending' });
              setShowAddAccount(false);
            }}>
              Add Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payout Settings</DialogTitle>
            <DialogDescription>
              Configure your automatic payout preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Payout Frequency</Label>
              <Select defaultValue={settings?.payout_frequency || 'weekly'}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="manual">Manual Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Minimum Payout Amount</Label>
              <Input 
                type="number" 
                defaultValue={settings?.minimum_payout || 25}
                min="1"
              />
              <p className="text-xs text-muted-foreground">
                Payouts will only be processed when your available balance exceeds this amount.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button onClick={() => {
              toast({ title: 'Settings updated' });
              setShowSettings(false);
            }}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
