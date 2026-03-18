"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatAmount } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function OrderEditForm({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.paymentStatus);
  const [notes, setNotes] = useState(order.notes || '');
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, status, paymentStatus, notes }),
      });
      if (!res.ok) throw new Error('Update failed');
      router.push(`/admin/orders/${order.id}`);
    } catch (err) {
      console.error('Update failed', err);
      alert('Failed to update order.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <input type="hidden" name="orderId" value={order.id} />
      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
              <select name="status" id="status" value={status} onChange={e => setStatus(e.target.value)} className="w-full">
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentStatus">Payment Status</Label>
              <select name="paymentStatus" id="paymentStatus" value={paymentStatus} onChange={e => setPaymentStatus(e.target.value)} className="w-full">
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea id="notes" name="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Add internal notes about this order..." rows={5} />
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
              <span className="font-medium">${formatAmount(order.total)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          <Link href={`/admin/orders/${order.id}`}>
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </div>
    </form>
  );
}
