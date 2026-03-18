
'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getAllPayments, updatePaymentStatus, refundPayment } from '@/services/paymentService';
import { Payment } from '@/lib/types';
import { formatAmount } from '@/lib/currency';

const statusVariant = {
  'Pending': 'default',
  'Processing': 'secondary',
  'Completed': 'outline',
  'Failed': 'destructive',
  'Refunded': 'secondary',
} as const;

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isPending, startTransition] = useTransition();
  const [refundReason, setRefundReason] = useState('');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    setLoading(true);
    const data = await getAllPayments();
    setPayments(data);
    setLoading(false);
  };

  const handleUpdateStatus = async (paymentId: string, newStatus: Payment['status']) => {
    startTransition(async () => {
      try {
        await updatePaymentStatus(paymentId, newStatus);
        await loadPayments();
      } catch (error) {
        console.error('Failed to update payment status:', error);
      }
    });
  };

  const handleRefund = async () => {
    if (!selectedPayment) return;

    startTransition(async () => {
      try {
        await refundPayment(selectedPayment.id, refundReason || undefined);
        await loadPayments();
        setRefundDialogOpen(false);
        setRefundReason('');
        setSelectedPayment(null);
      } catch (error) {
        console.error('Failed to refund payment:', error);
      }
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getTotalStats = () => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const paid = payments.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
    return { total, paid, pending };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-headline font-bold mb-6">Payment Management</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Payment Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage all payment transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Total Payments</p>
          <p className="text-2xl font-bold">${formatAmount(stats.total)}</p>
          <p className="text-xs text-muted-foreground mt-1">{payments.length} transactions</p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Successful Payments</p>
          <p className="text-2xl font-bold text-green-600">${formatAmount(stats.paid)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {payments.filter(p => p.status === 'Completed').length} paid
          </p>
        </div>
        <div className="border rounded-lg p-4">
          <p className="text-sm text-muted-foreground">Pending Payments</p>
          <p className="text-2xl font-bold text-yellow-600">${formatAmount(stats.pending)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {payments.filter(p => p.status === 'Pending').length} pending
          </p>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction ID</TableHead>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No payments found.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-xs">
                    {payment.transactionId || payment.id.substring(0, 8)}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${payment.orderId}`}
                      className="text-primary hover:underline"
                    >
                      {payment.orderId}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.customerName}</p>
                      <p className="text-xs text-muted-foreground">{payment.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>{payment.paymentMethod}</TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={payment.status}
                      onValueChange={(value) => handleUpdateStatus(payment.id, value as Payment['status'])}
                      disabled={isPending}
                    >
                      <SelectTrigger className="w-32">
                        <Badge variant={statusVariant[payment.status]}>
                          {payment.status}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Processing">Processing</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Failed">Failed</SelectItem>
                        <SelectItem value="Refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(payment.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedPayment(payment);
                          setDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payment.status === 'Completed' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedPayment(payment);
                            setRefundDialogOpen(true);
                          }}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Payment Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-headline">Payment Details</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Payment ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm">{selectedPayment.transactionId || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order ID</Label>
                  <Link
                    href={`/admin/orders/${selectedPayment.orderId}`}
                    className="text-primary hover:underline"
                  >
                    {selectedPayment.orderId}
                  </Link>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge variant={statusVariant[selectedPayment.status]}>
                      {selectedPayment.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Name</Label>
                    <p>{selectedPayment.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p>{selectedPayment.customerEmail}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Amount</Label>
                    <p className="text-lg font-bold">
                      {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Payment Method</Label>
                    <p>{selectedPayment.paymentMethod}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created</Label>
                    <p>{formatDate(selectedPayment.createdAt)}</p>
                  </div>
                  {selectedPayment.updatedAt && (
                    <div>
                      <Label className="text-muted-foreground">Updated</Label>
                      <p>{formatDate(selectedPayment.updatedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {selectedPayment.metadata && Object.keys(selectedPayment.metadata).length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2">Additional Information</h3>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    <pre>{JSON.stringify(selectedPayment.metadata, null, 2)}</pre>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                {selectedPayment.status === 'Completed' && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDetailDialogOpen(false);
                      setRefundDialogOpen(true);
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Issue Refund
                  </Button>
                )}
                <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-headline">Issue Refund</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You are about to refund{' '}
                <span className="font-bold">
                  {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                </span>{' '}
                to {selectedPayment.customerName}.
              </p>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for Refund (optional)</Label>
                <Input
                  id="reason"
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleRefund} disabled={isPending} variant="destructive">
                  {isPending ? 'Processing...' : 'Confirm Refund'}
                </Button>
                <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
