
'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getOrders } from '@/services/orderService';
import { Skeleton } from '../ui/skeleton';
import { getSettings } from '@/app/admin/settings/actions';

type Settings = { currency?: string };

const statusVariant = {
    'Pending': 'default',
    'Shipped': 'secondary',
    'Delivered': 'outline',
    'Cancelled': 'destructive',
} as const;

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}


export default function RecentOrdersTable() {
    const [recentOrders, setRecentOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<Settings>({});

    const currencySymbol = getCurrencySymbol(settings?.currency);


    useEffect(() => {
        const fetchData = async () => {
            const [allOrders, fetchedSettings] = await Promise.all([
                getOrders(),
                getSettings()
            ]);
            setRecentOrders(allOrders.slice(0, 5));
            setSettings(fetchedSettings || {});
            setLoading(false);
        }
        fetchData();
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Recent Orders</CardTitle>
                    <CardDescription>An overview of the latest orders.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                     {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center p-2">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                            <Skeleton className="h-4 w-16" />
                        </div>
                     ))}
                   </div>
                </CardContent>
            </Card>
        )
    }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Recent Orders</CardTitle>
        <CardDescription>An overview of the latest orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order: Order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                </TableCell>
                <TableCell className="text-right">{currencySymbol}{order.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
