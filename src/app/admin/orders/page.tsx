
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getOrders } from '@/services/orderService';
import { getSettings } from '@/app/admin/settings/actions';
import Link from 'next/link';
import { Eye } from 'lucide-react';

const statusVariant = {
    'Pending': 'default',
    'Processing': 'default',
    'Shipped': 'secondary',
    'Delivered': 'outline',
    'Cancelled': 'destructive',
} as const;

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default async function OrdersPage() {
  const orders = await getOrders();
  const settings = await getSettings();
  const currencySymbol = getCurrencySymbol(settings?.currency);

  return (
    <div>
      <h1 className="text-3xl font-headline font-bold mb-6">Orders</h1>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium font-mono">#{order.id.substring(0, 8).toUpperCase()}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{order.paymentMethod}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{currencySymbol}{order.total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
