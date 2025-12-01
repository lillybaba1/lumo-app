import { requireAdmin } from '@/lib/auth-admin';
import { getAllBusinessAccounts } from '@/services/businessAccountService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Store, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function AdminSellersPage() {
  await requireAdmin();

  const businessAccounts = await getAllBusinessAccounts();

  // Separate by status for quick overview
  const pendingApproval = businessAccounts.filter(b => b.status === 'PENDING_APPROVAL');
  const pendingVerification = businessAccounts.filter(b => b.status === 'PENDING_VERIFICATION');
  const active = businessAccounts.filter(b => b.status === 'ACTIVE');
  const suspended = businessAccounts.filter(b => b.status === 'SUSPENDED');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING_APPROVAL':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300"><Clock className="h-3 w-3 mr-1" /> Pending Approval</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300"><AlertTriangle className="h-3 w-3 mr-1" /> Email Not Verified</Badge>;
      case 'ACTIVE':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300"><CheckCircle className="h-3 w-3 mr-1" /> Active</Badge>;
      case 'SUSPENDED':
        return <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1" /> Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold">Seller Accounts</h1>
        <p className="text-muted-foreground mt-1">
          Manage business accounts and seller applications
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className={pendingApproval.length > 0 ? "border-orange-500 bg-orange-50 dark:bg-orange-950" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-500" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApproval.length}</div>
            {pendingApproval.length > 0 && (
              <p className="text-xs text-orange-600 mt-1">Requires your review</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Pending Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerification.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting email verify</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Active Sellers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{active.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              Suspended
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspended.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approval Section - Highlighted */}
      {pendingApproval.length > 0 && (
        <Card className="mb-6 border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Clock className="h-5 w-5" />
              Applications Awaiting Review ({pendingApproval.length})
            </CardTitle>
            <CardDescription>
              These sellers have verified their email and are waiting for your approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApproval.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-orange-50 dark:bg-orange-950/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-orange-200 dark:bg-orange-800 flex items-center justify-center">
                      <Store className="h-5 w-5 text-orange-700 dark:text-orange-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{account.businessName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {account.contactPersonName} • {account.contactEmail}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Applied: {new Date(account.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button asChild>
                    <Link href={`/admin/sellers/${account.id}`}>
                      Review Application
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Sellers List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            All Seller Accounts ({businessAccounts.length})
          </CardTitle>
          <CardDescription>
            Complete list of all registered business accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {businessAccounts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No seller accounts yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {businessAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                      <Store className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{account.businessName}</h3>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.contactPersonName} • {account.contactEmail}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {account.businessAddress}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" asChild>
                    <Link href={`/admin/sellers/${account.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
