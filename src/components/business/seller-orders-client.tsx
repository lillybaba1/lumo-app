"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Package, Truck, CheckCircle, Clock, AlertTriangle,
  Send, Copy, ExternalLink, Loader2, DollarSign, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface OrderRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: string;
  items: any[];
  total: number;
  status: string;
  payment_status: string;
  payment_method: string;
  shipped_at: string | null;
  delivered_at: string | null;
  auto_confirm_at: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: string; icon: any }> = {
  'Pending': { label: 'Awaiting Payment', variant: 'default', icon: Clock },
  'Paid': { label: 'New Order — Prepare!', variant: 'secondary', icon: DollarSign },
  'Preparing': { label: 'Preparing', variant: 'secondary', icon: Package },
  'Shipped': { label: 'Shipped', variant: 'secondary', icon: Truck },
  'Delivered': { label: 'Delivered', variant: 'outline', icon: CheckCircle },
  'Payout Pending': { label: 'Payout Pending', variant: 'default', icon: DollarSign },
  'Completed': { label: 'Completed', variant: 'outline', icon: CheckCircle },
  'Disputed': { label: 'Disputed', variant: 'destructive', icon: AlertTriangle },
  'Cancelled': { label: 'Cancelled', variant: 'destructive', icon: AlertTriangle },
};

export default function SellerOrdersClient({ businessAccountId }: { businessAccountId: string }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [shippedResult, setShippedResult] = useState<{ orderId: string; confirmationLink: string; whatsappLink: string | null } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    try {
      const res = await fetch('/api/orders/seller-orders');
      const data = await res.json();
      if (data.orders) {
        setOrders(data.orders);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPreparing(orderId: string) {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/orders/mark-preparing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        await fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update order');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkShipped(orderId: string) {
    setActionLoading(orderId);
    try {
      const res = await fetch('/api/orders/mark-shipped', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShippedResult({
          orderId,
          confirmationLink: data.confirmationLink,
          whatsappLink: data.whatsappLink,
        });
        await fetchOrders();
      } else {
        alert(data.error || 'Failed to mark as shipped');
      }
    } catch {
      alert('Something went wrong');
    } finally {
      setActionLoading(null);
    }
  }

  function copyLink(link: string) {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  function formatCurrency(amount: number) {
    return `D${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shipped confirmation modal */}
      {shippedResult && (
        <Card className="border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
          <CardHeader>
            <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Order Shipped Successfully!
            </CardTitle>
            <CardDescription>
              Send the confirmation link to the buyer so they can confirm delivery.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Confirmation Link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shippedResult.confirmationLink}
                  className="flex-1 px-3 py-2 border rounded-md text-sm bg-white dark:bg-gray-900 font-mono"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyLink(shippedResult.confirmationLink)}
                >
                  {copiedLink ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3">
              {shippedResult.whatsappLink && (
                <a href={shippedResult.whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send via WhatsApp
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                onClick={() => setShippedResult(null)}
              >
                Close
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              The buyer has 7 days to confirm delivery. After that, it will be auto-confirmed.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Orders', count: orders.filter(o => o.status === 'Paid').length, color: 'text-blue-600' },
          { label: 'Preparing', count: orders.filter(o => o.status === 'Preparing').length, color: 'text-amber-600' },
          { label: 'Shipped', count: orders.filter(o => o.status === 'Shipped').length, color: 'text-purple-600' },
          { label: 'Completed', count: orders.filter(o => ['Completed', 'Delivered', 'Payout Pending'].includes(o.status)).length, color: 'text-green-600' },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-3 text-center">
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={fetchOrders} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No orders yet. When customers buy your products, orders will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const config = statusConfig[order.status] || statusConfig['Pending'];
            const StatusIcon = config.icon;
            const isActionable = ['Paid', 'Preparing'].includes(order.status);

            return (
              <Card key={order.id} className={isActionable ? 'border-l-4 border-l-primary' : ''}>
                <CardContent className="pt-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm text-muted-foreground">
                          #{order.id.substring(0, 8)}
                        </span>
                        <Badge variant={config.variant as any} className="text-xs">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>
                      <p className="font-medium truncate">{order.customer_name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.items?.length || 0} item(s) • {formatCurrency(order.total)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(order.created_at)}
                        {order.shipped_at && ` • Shipped ${formatDate(order.shipped_at)}`}
                      </p>
                      {order.shipping_address && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          📍 {order.shipping_address}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {order.status === 'Paid' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkPreparing(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Package className="h-4 w-4 mr-1" />
                          )}
                          Start Preparing
                        </Button>
                      )}

                      {order.status === 'Preparing' && (
                        <Button
                          size="sm"
                          onClick={() => handleMarkShipped(order.id)}
                          disabled={actionLoading === order.id}
                        >
                          {actionLoading === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Truck className="h-4 w-4 mr-1" />
                          )}
                          Mark as Shipped
                        </Button>
                      )}

                      {order.status === 'Shipped' && order.auto_confirm_at && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          <Clock className="h-3 w-3 inline mr-1" />
                          Auto-confirms {formatDate(order.auto_confirm_at)}
                        </p>
                      )}

                      {order.status === 'Completed' && (
                        <p className="text-xs text-green-600">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Payment released
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order items preview */}
                  {order.items && order.items.length > 0 && (
                    <>
                      <Separator className="my-3" />
                      <div className="space-y-1">
                        {order.items.slice(0, 3).map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="truncate flex-1 mr-2">
                              {item.product?.name || item.productName || 'Product'} × {item.quantity || 1}
                            </span>
                            <span className="text-muted-foreground flex-shrink-0">
                              {formatCurrency((item.product?.price ?? item.price ?? 0) * (item.quantity || 1))}
                            </span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{order.items.length - 3} more item(s)
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
