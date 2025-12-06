'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { 
  Plus, Tag, Trash2, Edit, Loader2, Copy, Calendar, 
  Percent, DollarSign, Check, X 
} from "lucide-react";
import { createCouponAction, updateCouponAction, deleteCouponAction } from './actions';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_customer_limit: number;
  applies_to: 'all' | 'specific';
  product_ids: string[] | null;
  starts_at: string;
  expires_at: string | null;
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
  coupons: Coupon[];
  products: Product[];
  sellerId: string;
}

export default function CouponsTab({ coupons, products, sellerId }: Props) {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minPurchase, setMinPurchase] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [perCustomerLimit, setPerCustomerLimit] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');

  const resetForm = () => {
    setCode('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinPurchase('');
    setMaxDiscount('');
    setUsageLimit('');
    setPerCustomerLimit('1');
    setExpiresAt('');
    setEditingCoupon(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discount_type);
    setDiscountValue(coupon.discount_value.toString());
    setMinPurchase(coupon.min_purchase.toString());
    setMaxDiscount(coupon.max_discount?.toString() || '');
    setUsageLimit(coupon.usage_limit?.toString() || '');
    setPerCustomerLimit(coupon.per_customer_limit.toString());
    setExpiresAt(coupon.expires_at ? coupon.expires_at.split('T')[0] : '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!code || !discountValue) {
      toast({ title: 'Error', description: 'Code and discount value are required', variant: 'destructive' });
      return;
    }

    setLoading('submit');

    try {
      const data = {
        sellerId,
        code,
        description: description || undefined,
        discountType,
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
        perCustomerLimit: parseInt(perCustomerLimit) || 1,
        appliesTo: 'all' as const,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      let result;
      if (editingCoupon) {
        result = await updateCouponAction(editingCoupon.id, data);
      } else {
        result = await createCouponAction(data);
      }

      if (result.success) {
        toast({ title: editingCoupon ? 'Coupon Updated' : 'Coupon Created', description: 'Your coupon is ready to use!' });
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

  const handleToggleActive = async (coupon: Coupon) => {
    setLoading(coupon.id);
    try {
      const result = await updateCouponAction(coupon.id, { isActive: !coupon.is_active });
      if (result.success) {
        toast({ title: coupon.is_active ? 'Coupon Deactivated' : 'Coupon Activated' });
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete coupon "${coupon.code}"?`)) return;
    
    setLoading(coupon.id);
    try {
      const result = await deleteCouponAction(coupon.id);
      if (result.success) {
        toast({ title: 'Coupon Deleted' });
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!', description: `Code "${code}" copied to clipboard` });
  };

  const isExpired = (coupon: Coupon) => {
    return coupon.expires_at && new Date(coupon.expires_at) < new Date();
  };

  const getStatus = (coupon: Coupon) => {
    if (!coupon.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (isExpired(coupon)) return { label: 'Expired', variant: 'destructive' as const };
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { label: 'Limit Reached', variant: 'outline' as const };
    }
    return { label: 'Active', variant: 'default' as const };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Discount Coupons</h3>
          <p className="text-sm text-muted-foreground">
            Create coupon codes for your customers
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCoupon ? 'Edit Coupon' : 'Create Coupon'}</DialogTitle>
              <DialogDescription>
                {editingCoupon ? 'Update your coupon details' : 'Create a new discount coupon for your customers'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g., SAVE20"
                  className="uppercase"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., 20% off your first order"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={(v: 'percentage' | 'fixed') => setDiscountType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountValue">
                    Discount {discountType === 'percentage' ? '(%)' : '($)'} *
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '20' : '10.00'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minPurchase">Min. Purchase ($)</Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    value={minPurchase}
                    onChange={(e) => setMinPurchase(e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                {discountType === 'percentage' && (
                  <div className="space-y-2">
                    <Label htmlFor="maxDiscount">Max Discount ($)</Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(e.target.value)}
                      placeholder="No limit"
                      min="0"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="usageLimit">Total Usage Limit</Label>
                  <Input
                    id="usageLimit"
                    type="number"
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                    placeholder="Unlimited"
                    min="1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perCustomerLimit">Per Customer Limit</Label>
                  <Input
                    id="perCustomerLimit"
                    type="number"
                    value={perCustomerLimit}
                    onChange={(e) => setPerCustomerLimit(e.target.value)}
                    placeholder="1"
                    min="1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiration Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={loading === 'submit'}>
                {loading === 'submit' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingCoupon ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No coupons yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first coupon to start offering discounts
            </p>
            <Button onClick={handleOpenCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {coupons.map((coupon) => {
            const status = getStatus(coupon);
            return (
              <Card key={coupon.id} className={!coupon.is_active ? 'opacity-60' : ''}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <code className="text-lg font-bold bg-muted px-3 py-1 rounded">
                          {coupon.code}
                        </code>
                        <Button variant="ghost" size="icon" onClick={() => copyCode(coupon.code)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.is_active}
                        onCheckedChange={() => handleToggleActive(coupon)}
                        disabled={loading === coupon.id}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(coupon)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      {coupon.discount_type === 'percentage' ? (
                        <><Percent className="h-4 w-4" /> {coupon.discount_value}% off</>
                      ) : (
                        <><DollarSign className="h-4 w-4" /> ${coupon.discount_value} off</>
                      )}
                    </span>
                    
                    {coupon.min_purchase > 0 && (
                      <span>Min: ${coupon.min_purchase}</span>
                    )}
                    
                    {coupon.usage_limit && (
                      <span>Used: {coupon.usage_count}/{coupon.usage_limit}</span>
                    )}
                    
                    {coupon.expires_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Expires: {new Date(coupon.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {coupon.description && (
                    <p className="mt-2 text-sm">{coupon.description}</p>
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
