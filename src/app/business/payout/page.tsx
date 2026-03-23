import { requireBusiness } from "@/lib/auth-business";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, Wallet, DollarSign, Calendar, CheckCircle, AlertCircle, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import PayoutSettingsForm from "./payout-form";
import MobileMoneyManager from "./mobile-money-manager";
import { formatAmount } from '@/lib/currency';

export const dynamic = 'force-dynamic';

export default async function BusinessPayoutPage() {
  const { user, businessAccount } = await requireBusiness();
  
  // Platform admin doesn't need payout settings
  const isAdmin = user.role === 'APP_OWNER_ADMIN';
  
  const hasPayoutSetup = businessAccount.payoutMethod && businessAccount.payoutDetails;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
          <CreditCard className="h-8 w-8" />
          Payout Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure how you receive payments from your sales
        </p>
      </div>

      {/* Admin Notice */}
      {isAdmin && (
        <Card className="mb-6 border-blue-200 bg-blue-50 dark:bg-blue-950">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">Platform Owner Account</p>
                <p className="text-sm text-blue-600 dark:text-blue-300">
                  As the platform owner, all sales revenue goes directly to the platform. No payout configuration needed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earnings Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-xl font-bold">${formatAmount(businessAccount.totalEarnings || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Wallet className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Payout</p>
                <p className="text-xl font-bold">${formatAmount(businessAccount.pendingPayout || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Commission Paid</p>
                <p className="text-xl font-bold">${formatAmount(businessAccount.totalCommissionPaid || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasPayoutSetup || isAdmin ? 'bg-green-100' : 'bg-red-100'}`}>
                {hasPayoutSetup || isAdmin ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payout Status</p>
                <Badge variant={hasPayoutSetup || isAdmin ? 'default' : 'destructive'} className="mt-1">
                  {isAdmin ? 'Not Required' : hasPayoutSetup ? 'Configured' : 'Not Set Up'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payout Form - Hide for admin */}
      {!isAdmin && (
        <PayoutSettingsForm 
          businessAccountId={businessAccount.id}
          currentMethod={businessAccount.payoutMethod || ''}
          currentDetails={businessAccount.payoutDetails || {}}
        />
      )}

      {/* Mobile Money Accounts — shown to buyers at checkout */}
      <MobileMoneyManager
        businessAccountId={businessAccount.id}
        currentAccounts={businessAccount.mobileMoneyAccounts || []}
      />
    </div>
  );
}
