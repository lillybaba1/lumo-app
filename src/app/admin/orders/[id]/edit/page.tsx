
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
import { Order } from '@/lib/types';
import OrderEditForm from '@/components/admin/order-edit-form';
import { revalidatePath } from 'next/cache';

async function updateOrderAction(formData: FormData) {
  'use server';

  const orderId = formData.get('orderId') as string;
  const status = formData.get('status') as Order['status'];
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

      <OrderEditForm order={order} />
    </div>
  );
}
