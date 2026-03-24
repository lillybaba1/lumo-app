import { getOrderById } from '@/services/orderService';
import { getPaymentByOrder } from '@/services/paymentService';
import { formatAmount } from '@/lib/currency';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Package, MapPin, CreditCard, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [order, payment] = await Promise.all([
    getOrderById(id),
    getPaymentByOrder(id),
  ]);

  if (!order) {
    notFound();
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-500';
      case 'Processing':
        return 'bg-blue-500';
      case 'Shipped':
        return 'bg-purple-500';
      case 'Delivered':
        return 'bg-green-500';
      case 'Cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-500';
      case 'Pending':
        return 'bg-yellow-500';
      case 'Failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-headline font-bold mb-2">Order #{order.id.substring(0, 8).toUpperCase()}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getStatusColor(order.status)}`}>
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Status</p>
                  <p className="font-semibold text-lg">{order.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Payment Status</p>
                  <p className="font-semibold text-lg">{order.paymentStatus}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Details */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item: any, index: number) => {
              // Support both formats:
              // Old: { product: { name, price, productImages, imageUrls, description }, quantity }
              // New (simplified): { productName, price, quantity, productId, sellerId }
              const name = item.product?.name || item.productName || 'Product';
              const price = item.product?.price ?? item.price ?? 0;
              const description = item.product?.description || '';
              const images = item.product?.productImages || item.product?.imageUrls || [];
              const qty = item.quantity || 1;

              return (
                <div key={index}>
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-muted rounded flex-shrink-0 relative overflow-hidden">
                      {images.length > 0 && (
                        <Image
                          src={images[0]}
                          alt={name}
                          fill
                          sizes="80px"
                          className="object-cover rounded"
                        />
                      )}
                      {images.length === 0 && (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{name}</h3>
                      {description && <p className="text-sm text-muted-foreground">{description}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm">Qty: {qty}</span>
                        <span className="font-semibold">${formatAmount(price * qty)}</span>
                      </div>
                    </div>
                  </div>
                  {index < order.items.length - 1 && <Separator className="mt-4" />}
                </div>
              );
            })}

            <Separator className="my-4" />

            {/* Price Breakdown */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>${formatAmount(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                  <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                  <span>-${formatAmount(order.discount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${formatAmount(order.total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-semibold">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress}</p>
              {order.customerPhone && (
                <p className="text-sm text-muted-foreground">Phone: {order.customerPhone}</p>
              )}
              <p className="text-sm text-muted-foreground">Email: {order.customerEmail}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge className={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus}
                </Badge>
              </div>
              {payment && (
                <>
                  <Separator className="my-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Record</p>
                    <Link href="/payments" className="text-primary hover:underline text-sm">
                      View Payment Details
                    </Link>
                  </div>
                  {payment.transactionId && (
                    <div>
                      <p className="text-sm text-muted-foreground">Transaction ID</p>
                      <p className="font-mono text-sm">{payment.transactionId}</p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Notes (if any) */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="font-headline flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Order Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Order Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <div className="w-0.5 h-full bg-muted" />
                </div>
                <div className="pb-4">
                  <p className="font-semibold">Order Placed</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>

              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-0.5 h-full bg-muted" />
                  </div>
                  <div>
                    <p className="font-semibold">Status Updated to {order.status}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <h3 className="font-semibold">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                If you have any questions about your order, please contact our customer service.
              </p>
              <p className="text-sm">
                Email: <a href={`mailto:support@julazone.com?subject=Order ${order.id}`} className="text-primary hover:underline">
                  support@julazone.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
