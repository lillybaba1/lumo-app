'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  AlertTriangle,
  Search,
  Download,
  Upload,
  Save,
  RefreshCw,
  Bell,
  BellOff,
  Filter,
} from 'lucide-react';
import { getInventoryAlerts, dismissInventoryAlert, bulkUpdateStock } from '../products/variant-actions';
import { useToast } from '@/hooks/use-toast';

interface InventoryItem {
  id: string;
  product_id: string;
  product_name: string;
  variant_name: string;
  sku: string;
  stock_quantity: number;
  low_stock_threshold: number;
}

interface Alert {
  id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'back_in_stock';
  product?: { id: string; name: string };
  variant?: { id: string; name: string };
  created_at: string;
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [editedStock, setEditedStock] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    
    // Load alerts
    const alertResult = await getInventoryAlerts();
    if (alertResult.success) {
      setAlerts(alertResult.data || []);
    }
    
    // Note: In production, you'd have a dedicated inventory endpoint
    // For now, this loads from alerts
    setLoading(false);
  }

  async function handleDismissAlert(id: string) {
    const result = await dismissInventoryAlert(id);
    if (result.success) {
      setAlerts(alerts.filter(a => a.id !== id));
      toast({ title: 'Alert dismissed' });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  async function handleSaveChanges() {
    const updates = Object.entries(editedStock).map(([variant_id, stock_quantity]) => ({
      variant_id,
      stock_quantity,
    }));

    if (updates.length === 0) {
      toast({ title: 'No changes to save' });
      return;
    }

    setSaving(true);
    const result = await bulkUpdateStock(updates);
    if (result.success) {
      toast({ title: `Updated ${updates.length} items` });
      setEditedStock({});
      loadData();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setSaving(false);
  }

  function handleStockChange(variantId: string, value: number) {
    setEditedStock({ ...editedStock, [variantId]: value });
  }

  const lowStockCount = alerts.filter(a => a.alert_type === 'low_stock').length;
  const outOfStockCount = alerts.filter(a => a.alert_type === 'out_of_stock').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track stock levels, set alerts, and manage inventory
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={handleSaveChanges} disabled={saving || Object.keys(editedStock).length === 0}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventory.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="alerts">
        <TabsList>
          <TabsTrigger value="alerts">
            Alerts
            {alerts.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {alerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="inventory">All Inventory</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Alerts</CardTitle>
              <CardDescription>
                Products that need attention based on your stock thresholds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p>No active alerts</p>
                  <p className="text-sm">Your inventory is looking good!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${
                          alert.alert_type === 'out_of_stock'
                            ? 'bg-destructive/10'
                            : alert.alert_type === 'low_stock'
                            ? 'bg-yellow-500/10'
                            : 'bg-green-500/10'
                        }`}>
                          <AlertTriangle className={`h-5 w-5 ${
                            alert.alert_type === 'out_of_stock'
                              ? 'text-destructive'
                              : alert.alert_type === 'low_stock'
                              ? 'text-yellow-500'
                              : 'text-green-500'
                          }`} />
                        </div>
                        <div>
                          <p className="font-medium">
                            {alert.product?.name}
                            {alert.variant && ` - ${alert.variant.name}`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {alert.alert_type === 'out_of_stock' && 'Out of stock - restock needed'}
                            {alert.alert_type === 'low_stock' && 'Low stock - consider restocking'}
                            {alert.alert_type === 'back_in_stock' && 'Back in stock'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          alert.alert_type === 'out_of_stock' ? 'destructive' :
                          alert.alert_type === 'low_stock' ? 'secondary' : 'default'
                        }>
                          {alert.alert_type.replace('_', ' ')}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDismissAlert(alert.id)}
                          title="Dismiss alert"
                        >
                          <BellOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory List</CardTitle>
                  <CardDescription>
                    View and update stock levels for all products
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <div className="flex border rounded-md">
                    <Button
                      variant={filter === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={filter === 'low' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('low')}
                    >
                      Low Stock
                    </Button>
                    <Button
                      variant={filter === 'out' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setFilter('out')}
                    >
                      Out of Stock
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>New Stock</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        <Package className="h-8 w-8 mx-auto mb-2" />
                        <p>No inventory items found</p>
                        <p className="text-sm">Add variants to your products to track inventory</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.product_name}</TableCell>
                        <TableCell>{item.variant_name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.sku || '-'}</TableCell>
                        <TableCell>{item.stock_quantity}</TableCell>
                        <TableCell>
                          {item.stock_quantity === 0 ? (
                            <Badge variant="destructive">Out of Stock</Badge>
                          ) : item.stock_quantity <= item.low_stock_threshold ? (
                            <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-green-500/10 text-green-600">
                              In Stock
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="w-24"
                            placeholder={String(item.stock_quantity)}
                            value={editedStock[item.id] ?? ''}
                            onChange={(e) => handleStockChange(item.id, parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
