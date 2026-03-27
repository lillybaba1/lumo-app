
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getOrderById } from '@/services/orderService';
import { getPaymentByOrder } from '@/services/paymentService';
import { getSettings } from '@/app/admin/settings/actions';
import { getCurrencySymbol } from '@/lib/currency';
import { EscrowActions } from '@/components/admin/escrow-actions';

const statusVariant: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  'Pending': 'default',
  'Paid': 'secondary',
  'Preparing': 'secondary',
  'Shipped': 'secondary',
  'Delivered': 'outline',
  'Payout Pending': 'default',
  'Completed': 'outline',
  'Disputed': 'destructive',
  'Cancelled': 'destructive',
};

const paymentStatusVariant: Record<string, 'default' | 'outline' | 'destructive'> = {
  'Pending': 'default',
  'Paid': 'outline',
  'Failed': 'destructive',
};

function formatCurrency(amount: number, currencySymbol: string) {
  return `${currencySymbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const [payment, settings] = await Promise.all([
    getPaymentByOrder(order.id),
    getSettings()
  ]);

  const currencySymbol = getCurrencySymbol(settings?.currency);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-headline font-bold">Order #{order.id}</h1>
            <p className="text-sm text-muted-foreground">
              Placed on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <Link href={`/admin/orders/${order.id}/edit`}>
          <Button>
            <Edit className="h-4 w-4 mr-2" />
            Edit Order
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Order Items */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item: any, index: number) => {
                  const name = item.product?.name || item.productName || 'Product';
                  const price = item.product?.price ?? item.price ?? 0;
                  const qty = item.quantity || 1;

                  return (
                    <div key={index}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold">{name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(price, currencySymbol)} × {qty}
                          </p>
                        </div>
                        <div className="font-semibold">
                          {formatCurrency(price * qty, currencySymbol)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(order.subtotal, currencySymbol)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Discount {order.couponCode && `(${order.couponCode})`}
                    </span>
                    <span className="text-green-600">
                      -{formatCurrency(order.discount, currencySymbol)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total, currencySymbol)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Order Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Order Status</p>
                <Badge variant={statusVariant[order.status]} className="text-sm">
                  {order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Status</p>
                <Badge variant={paymentStatusVariant[order.paymentStatus]} className="text-sm">
                  {order.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Payment Method</p>
                <p className="font-medium">{order.paymentMethod}</p>
              </div>
              {payment?.transactionId && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
                  <p className="font-mono text-sm">{payment.transactionId}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escrow Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Escrow Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${order.paymentStatus === 'Paid' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={order.paymentStatus === 'Paid' ? 'font-medium' : 'text-muted-foreground'}>
                    Payment Received
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${['Preparing', 'Shipped', 'Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={['Preparing', 'Shipped', 'Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'font-medium' : 'text-muted-foreground'}>
                    Seller Preparing
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${['Shipped', 'Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={['Shipped', 'Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'font-medium' : 'text-muted-foreground'}>
                    Shipped {order.shippedAt && `— ${formatDate(order.shippedAt)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${['Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={['Delivered', 'Payout Pending', 'Completed'].includes(order.status) ? 'font-medium' : 'text-muted-foreground'}>
                    Buyer Confirmed {order.deliveredAt && `— ${formatDate(order.deliveredAt)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${order.status === 'Completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className={order.status === 'Completed' ? 'font-medium' : 'text-muted-foreground'}>
                    Payout Released {order.payoutAt && `— ${formatDate(order.payoutAt)}`}
                  </span>
                </div>
                {order.status === 'Disputed' && (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="font-medium text-red-600">Disputed</span>
                  </div>
                )}
              </div>

              {order.autoConfirmAt && order.status === 'Shipped' && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-xs text-amber-700 dark:text-amber-400">
                  Auto-confirms on {formatDate(order.autoConfirmAt)}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Escrow Actions */}
          {['Payout Pending', 'Disputed'].includes(order.status) && (
            <EscrowActions orderId={order.id} status={order.status} total={order.total} currencySymbol={currencySymbol} />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium truncate">{order.customerName}</p>
              </div>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium break-all text-sm">{order.customerEmail}</p>
              </div>
              {order.customerPhone && (
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium break-all">{order.customerPhone}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Shipping Address</p>
                <p className="font-medium whitespace-pre-line">{order.shippingAddress}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
