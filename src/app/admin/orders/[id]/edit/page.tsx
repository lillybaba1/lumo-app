
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { getOrderById, updateOrder } from '@/services/orderService';
import { revalidatePath } from 'next/cache';

async function updateOrderAction(formData: FormData) {
  'use server';

  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  const paymentStatus = formData.get('paymentStatus') as 'Pending' | 'Paid' | 'Failed';
  const notes = formData.get('notes') as string;

  await updateOrder(orderId, {
    status,
    paymentStatus,
    notes,
    updatedAt: new Date().toISOString(),
  });

  revalidatePath('/admin/orders');
  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/admin/orders/${orderId}`);
}

export default async function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/orders/${order.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-headline font-bold">Edit Order #{order.id}</h1>
      </div>

      <form action={updateOrderAction}>
        <input type="hidden" name="orderId" value={order.id} />

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Order Status</Label>
                <Select name="status" defaultValue={order.status}>
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Processing">Processing</SelectItem>
                    <SelectItem value="Shipped">Shipped</SelectItem>
                    <SelectItem value="Delivered">Delivered</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentStatus">Payment Status</Label>
                <Select name="paymentStatus" defaultValue={order.paymentStatus}>
                  <SelectTrigger id="paymentStatus">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                name="notes"
                defaultValue={order.notes || ''}
                placeholder="Add internal notes about this order..."
                rows={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-medium">{order.customerName}</span>

                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{order.customerEmail}</span>

                <span className="text-muted-foreground">Payment Method:</span>
                <span className="font-medium">{order.paymentMethod}</span>

                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">${order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit">Save Changes</Button>
            <Link href={`/admin/orders/${order.id}`}>
              <Button type="button" variant="outline">Cancel</Button>
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
