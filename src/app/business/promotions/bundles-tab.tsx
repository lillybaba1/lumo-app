'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatAmount } from '@/lib/currency';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Package, Trash2, Edit, Loader2, DollarSign, Percent } from "lucide-react";
import { createBundleAction, updateBundleAction, deleteBundleAction } from './actions';

interface Bundle {
  id: string;
  name: string;
  description: string | null;
  product_ids: string[];
  bundle_price: number;
  original_price: number;
  is_active: boolean;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
}

interface Props {
  bundles: Bundle[];
  products: Product[];
  sellerId: string;
}

export default function BundlesTab({ bundles, products, sellerId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [bundlePrice, setBundlePrice] = useState('');

  // Calculate original price based on selected products
  const originalPrice = selectedProducts.reduce((sum, id) => {
    const product = products.find(p => p.id === id);
    return sum + (product?.price || 0);
  }, 0);

  const savingsPercent = originalPrice > 0 && bundlePrice 
    ? Math.round(((originalPrice - parseFloat(bundlePrice)) / originalPrice) * 100)
    : 0;

  const resetForm = () => {
    setName('');
    setDescription('');
    setSelectedProducts([]);
    setBundlePrice('');
    setEditingBundle(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (bundle: Bundle) => {
    setEditingBundle(bundle);
    setName(bundle.name);
    setDescription(bundle.description || '');
    setSelectedProducts(bundle.product_ids || []);
    setBundlePrice(bundle.bundle_price.toString());
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || selectedProducts.length < 2 || !bundlePrice) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all fields and select at least 2 products', 
        variant: 'destructive' 
      });
      return;
    }

    if (parseFloat(bundlePrice) >= originalPrice) {
      toast({ 
        title: 'Error', 
        description: 'Bundle price must be less than the total original price', 
        variant: 'destructive' 
      });
      return;
    }

    setLoading('submit');

    try {
      const data = {
        sellerId,
        name,
        description: description || undefined,
        productIds: selectedProducts,
        bundlePrice: parseFloat(bundlePrice),
        originalPrice,
      };

      let result;
      if (editingBundle) {
        result = await updateBundleAction(editingBundle.id, data);
      } else {
        result = await createBundleAction(data);
      }

      if (result.success) {
        toast({ title: editingBundle ? 'Bundle Updated' : 'Bundle Created' });
        setDialogOpen(false);
        resetForm();
        router.refresh();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setLoading(null);
    }
  };

  const handleToggleActive = async (bundle: Bundle) => {
    setLoading(bundle.id);
    try {
      const result = await updateBundleAction(bundle.id, { isActive: !bundle.is_active });
      if (result.success) {
        toast({ title: bundle.is_active ? 'Bundle Deactivated' : 'Bundle Activated' });
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (bundle: Bundle) => {
    if (!confirm(`Are you sure you want to delete "${bundle.name}"?`)) return;
    
    setLoading(bundle.id);
    try {
      const result = await deleteBundleAction(bundle.id);
      if (result.success) {
        toast({ title: 'Bundle Deleted' });
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const calculateSavings = (bundle: Bundle) => {
    return Math.round(((bundle.original_price - bundle.bundle_price) / bundle.original_price) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Bundle Deals</h3>
          <p className="text-sm text-muted-foreground">
            Create product bundles with special pricing
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingBundle ? 'Edit Bundle' : 'Create Bundle'}</DialogTitle>
              <DialogDescription>
                Combine products together at a special price
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Bundle Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Essentials Pack"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what's included in this bundle"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Select Products * (min. 2)</Label>
                <ScrollArea className="h-48 border rounded-md p-2">
                  {products.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No products available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                        >
                          <Checkbox
                            id={`bundle-${product.id}`}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <label
                            htmlFor={`bundle-${product.id}`}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            {product.name}
                          </label>
                          <span className="text-sm font-medium">
                            ${formatAmount(product.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {selectedProducts.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedProducts.length} products selected • Original total: ${formatAmount(originalPrice)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bundlePrice">Bundle Price *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bundlePrice"
                    type="number"
                    value={bundlePrice}
                    onChange={(e) => setBundlePrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="pl-8"
                  />
                </div>
                {bundlePrice && originalPrice > 0 && (
                  <p className={`text-sm ${savingsPercent > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {savingsPercent > 0 
                      ? `Customers save ${savingsPercent}% ($${formatAmount(originalPrice - parseFloat(bundlePrice))})`
                      : 'Bundle price must be less than original total'
                    }
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading === 'submit'}>
                {loading === 'submit' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingBundle ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bundles List */}
      {bundles.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No bundles yet</h3>
            <p className="text-muted-foreground mb-4">
              Create product bundles to encourage larger purchases
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Bundle
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bundles.map((bundle) => {
            const savings = calculateSavings(bundle);
            const productNames = products
              .filter(p => bundle.product_ids?.includes(p.id))
              .map(p => p.name);

            return (
              <Card key={bundle.id} className={!bundle.is_active ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-purple-500" />
                        <span className="text-lg font-semibold">{bundle.name}</span>
                      </div>
                      <Badge variant={bundle.is_active ? 'default' : 'secondary'}>
                        {bundle.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-600">
                        Save {savings}%
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={bundle.is_active}
                        onCheckedChange={() => handleToggleActive(bundle)}
                        disabled={loading === bundle.id}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(bundle)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(bundle)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="text-muted-foreground line-through">${formatAmount(bundle.original_price)}</span>
                      <span className="font-bold text-green-600">${formatAmount(bundle.bundle_price)}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {bundle.product_ids?.length || 0} products
                    </span>
                  </div>

                  {bundle.description && (
                    <p className="mt-2 text-sm text-muted-foreground">{bundle.description}</p>
                  )}

                  {productNames.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {productNames.map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
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
