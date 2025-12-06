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
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Zap, Trash2, Edit, Loader2, Clock, Percent } from "lucide-react";
import { createFlashSaleAction, updateFlashSaleAction, deleteFlashSaleAction } from './actions';

interface FlashSale {
  id: string;
  name: string;
  description: string | null;
  discount_percentage: number;
  product_ids: string[];
  starts_at: string;
  ends_at: string;
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
  flashSales: FlashSale[];
  products: Product[];
  sellerId: string;
}

export default function FlashSalesTab({ flashSales, products, sellerId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [editingSale, setEditingSale] = useState<FlashSale | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountPercentage, setDiscountPercentage] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');

  const resetForm = () => {
    setName('');
    setDescription('');
    setDiscountPercentage('');
    setSelectedProducts([]);
    setStartsAt('');
    setEndsAt('');
    setEditingSale(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (sale: FlashSale) => {
    setEditingSale(sale);
    setName(sale.name);
    setDescription(sale.description || '');
    setDiscountPercentage(sale.discount_percentage.toString());
    setSelectedProducts(sale.product_ids || []);
    setStartsAt(sale.starts_at.slice(0, 16));
    setEndsAt(sale.ends_at.slice(0, 16));
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name || !discountPercentage || selectedProducts.length === 0 || !startsAt || !endsAt) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    if (new Date(startsAt) >= new Date(endsAt)) {
      toast({ title: 'Error', description: 'End time must be after start time', variant: 'destructive' });
      return;
    }

    setLoading('submit');

    try {
      const data = {
        sellerId,
        name,
        description: description || undefined,
        discountPercentage: parseFloat(discountPercentage),
        productIds: selectedProducts,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      };

      let result;
      if (editingSale) {
        result = await updateFlashSaleAction(editingSale.id, data);
      } else {
        result = await createFlashSaleAction(data);
      }

      if (result.success) {
        toast({ title: editingSale ? 'Flash Sale Updated' : 'Flash Sale Created' });
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

  const handleToggleActive = async (sale: FlashSale) => {
    setLoading(sale.id);
    try {
      const result = await updateFlashSaleAction(sale.id, { isActive: !sale.is_active });
      if (result.success) {
        toast({ title: sale.is_active ? 'Flash Sale Deactivated' : 'Flash Sale Activated' });
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (sale: FlashSale) => {
    if (!confirm(`Are you sure you want to delete "${sale.name}"?`)) return;
    
    setLoading(sale.id);
    try {
      const result = await deleteFlashSaleAction(sale.id);
      if (result.success) {
        toast({ title: 'Flash Sale Deleted' });
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

  const getStatus = (sale: FlashSale) => {
    const now = new Date();
    const start = new Date(sale.starts_at);
    const end = new Date(sale.ends_at);

    if (!sale.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (now < start) return { label: 'Scheduled', variant: 'outline' as const };
    if (now > end) return { label: 'Ended', variant: 'destructive' as const };
    return { label: 'Live', variant: 'default' as const };
  };

  const getTimeRemaining = (sale: FlashSale) => {
    const now = new Date();
    const end = new Date(sale.ends_at);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} left`;
    }
    return `${hours}h ${minutes}m left`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Flash Sales</h3>
          <p className="text-sm text-muted-foreground">
            Create time-limited sales to drive urgency
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flash Sale
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingSale ? 'Edit Flash Sale' : 'Create Flash Sale'}</DialogTitle>
              <DialogDescription>
                Set up a time-limited discount on selected products
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sale Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekend Flash Sale"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount Percentage *</Label>
                <div className="relative">
                  <Input
                    id="discount"
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(e.target.value)}
                    placeholder="20"
                    min="1"
                    max="100"
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startsAt">Starts At *</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={startsAt}
                    onChange={(e) => setStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endsAt">Ends At *</Label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Select Products * ({selectedProducts.length} selected)</Label>
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
                            id={product.id}
                            checked={selectedProducts.includes(product.id)}
                            onCheckedChange={() => toggleProduct(product.id)}
                          />
                          <label
                            htmlFor={product.id}
                            className="flex-1 text-sm cursor-pointer"
                          >
                            {product.name}
                          </label>
                          <span className="text-sm text-muted-foreground">
                            ${product.price}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading === 'submit'}>
                {loading === 'submit' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingSale ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Flash Sales List */}
      {flashSales.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flash sales yet</h3>
            <p className="text-muted-foreground mb-4">
              Create a flash sale to boost sales with time-limited offers
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flash Sale
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {flashSales.map((sale) => {
            const status = getStatus(sale);
            const timeRemaining = getTimeRemaining(sale);
            const productNames = products
              .filter(p => sale.product_ids?.includes(p.id))
              .map(p => p.name);

            return (
              <Card key={sale.id} className={!sale.is_active ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Zap className={`h-5 w-5 ${status.label === 'Live' ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className="text-lg font-semibold">{sale.name}</span>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {timeRemaining && status.label === 'Live' && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-600">
                          <Clock className="h-3 w-3 mr-1" />
                          {timeRemaining}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={sale.is_active}
                        onCheckedChange={() => handleToggleActive(sale)}
                        disabled={loading === sale.id}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(sale)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(sale)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1 font-medium text-orange-600">
                      <Percent className="h-4 w-4" />
                      {sale.discount_percentage}% off
                    </span>
                    <span>{sale.product_ids?.length || 0} products</span>
                    <span>
                      {new Date(sale.starts_at).toLocaleDateString()} - {new Date(sale.ends_at).toLocaleDateString()}
                    </span>
                  </div>

                  {productNames.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {productNames.slice(0, 3).map((name, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                      {productNames.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{productNames.length - 3} more
                        </Badge>
                      )}
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
