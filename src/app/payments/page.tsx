import { getPaymentsByCustomer } from '@/services/paymentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Calendar, DollarSign, FileText } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getSettings } from '@/app/admin/settings/actions';
import { formatAmount } from '@/lib/currency';

async function getCurrencySymbol(currencyCode: string | undefined) {
  if (!currencyCode) return '$';
  if (currencyCode === 'GMD') return 'D';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default async function PaymentHistoryPage() {
  // TODO: Get current user from auth context
  const currentUserEmail = undefined;

  const settings = await getSettings();
  const currencySymbol = await getCurrencySymbol(settings?.currency);

  if (!currentUserEmail) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-headline font-bold mb-4">Payment History</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view your payment history.
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  const payments = await getPaymentsByCustomer(currentUserEmail);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-500';
      case 'Processing':
        return 'bg-blue-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Failed':
        return 'bg-red-500';
      case 'Refunded':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'Failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const totalPaid = payments
    .filter(p => p.status === 'Completed')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-headline font-bold mb-2">Payment History</h1>
          <p className="text-muted-foreground">
            View and manage your payment records
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-green-500/10">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Paid</p>
                  <p className="font-semibold text-lg">{currencySymbol}{formatAmount(totalPaid)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-blue-500/10">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="font-semibold text-lg">{payments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-purple-500/10">
                  <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="font-semibold text-lg">
                    {payments.filter(p => p.status === 'Completed').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment List */}
        {payments.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Payment Records</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  You haven&apos;t made any payments yet.
                </p>
                <Button asChild>
                  <Link href="/">Browse Products</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${getStatusColor(payment.status)}/10`}>
                        <CreditCard className={`h-5 w-5 ${getStatusColor(payment.status).replace('bg-', 'text-')}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">
                            Payment #{payment.id.substring(0, 8).toUpperCase()}
                          </h3>
                          <Badge variant={getStatusVariant(payment.status)}>
                            {payment.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Order: <Link href={`/orders/${payment.orderId}`} className="text-primary hover:underline">
                            #{payment.orderId.substring(0, 8).toUpperCase()}
                          </Link>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Method: {payment.paymentMethod}
                        </p>
                        {payment.transactionId && (
                          <p className="text-xs text-muted-foreground">
                            Transaction ID: {payment.transactionId}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col md:items-end gap-2">
                      <p className="text-2xl font-bold text-primary">
                        {currencySymbol}{formatAmount(payment.amount)}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(payment.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      {payment.updatedAt && payment.updatedAt !== payment.createdAt && (
                        <p className="text-xs text-muted-foreground">
                          Updated: {new Date(payment.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  {(() => {
                    const note = payment.metadata?.note;
                    if (typeof note === 'string' && note) {
                      return (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-medium">Note:</span> {note}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
