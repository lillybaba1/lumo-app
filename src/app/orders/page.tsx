import { getOrdersByEmail } from '@/services/orderService';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, ChevronRight, ShoppingBag, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getStatusIcon(status: string) {
  switch (status) {
    case 'Pending':
      return <Clock className="h-4 w-4" />;
    case 'Processing':
      return <Package className="h-4 w-4" />;
    case 'Shipped':
      return <Truck className="h-4 w-4" />;
    case 'Delivered':
      return <CheckCircle className="h-4 w-4" />;
    case 'Cancelled':
      return <XCircle className="h-4 w-4" />;
    default:
      return <Package className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'Processing':
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
    case 'Shipped':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
    case 'Delivered':
      return 'bg-green-500/10 text-green-600 border-green-500/20';
    case 'Cancelled':
      return 'bg-red-500/10 text-red-600 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  }
}

export default async function MyOrdersPage() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/orders');
  }

  const orders = await getOrdersByEmail(user.email || '');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <ShoppingBag className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl md:text-3xl font-headline font-bold">My Orders</h1>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-4 text-center">
              When you place an order, it will appear here.
            </p>
            <Button asChild>
              <Link href="/products">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">
                          Order #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`flex items-center gap-1 ${getStatusColor(order.status)}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <div className="flex items-center gap-4 text-sm">
                        <span>{order.items?.length || 0} item(s)</span>
                        <span className="font-semibold">${order.total.toFixed(2)}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground hidden md:block" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
