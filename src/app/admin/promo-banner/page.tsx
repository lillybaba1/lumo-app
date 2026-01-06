"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Loader2, 
  Percent, 
  Tag, 
  Gift, 
  Star, 
  Sparkles, 
  Flame, 
  Truck, 
  Clock,
  Plus,
  X,
  Search,
  Eye,
  EyeOff,
  Megaphone
} from 'lucide-react';
import { getPromoBannerSettings, savePromoBannerSettings, getAllProducts } from './actions';
import { PromoBannerSettings, DEFAULT_PROMO_BANNER_SETTINGS, Product } from '@/lib/types';
import Image from 'next/image';

const ICON_OPTIONS = [
  { value: 'percent', label: 'Percent', icon: Percent },
  { value: 'tag', label: 'Tag', icon: Tag },
  { value: 'gift', label: 'Gift', icon: Gift },
  { value: 'star', label: 'Star', icon: Star },
  { value: 'sparkles', label: 'Sparkles', icon: Sparkles },
  { value: 'flame', label: 'Flame', icon: Flame },
  { value: 'truck', label: 'Truck', icon: Truck },
  { value: 'clock', label: 'Clock', icon: Clock },
];

export default function PromoBannerPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<PromoBannerSettings>(DEFAULT_PROMO_BANNER_SETTINGS);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [productPopoverOpen, setProductPopoverOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [settingsData, productsData] = await Promise.all([
        getPromoBannerSettings(),
        getAllProducts()
      ]);
      setSettings(settingsData);
      setAllProducts(productsData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "Error",
        description: "Failed to load promo banner settings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await savePromoBannerSettings(settings);
      if (success) {
        toast({
          title: "Settings Saved",
          description: "Promo banner settings have been updated.",
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save promo banner settings.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addProduct = (productId: string) => {
    if (!settings.productIds.includes(productId)) {
      setSettings(prev => ({
        ...prev,
        productIds: [...prev.productIds, productId]
      }));
    }
    setProductPopoverOpen(false);
    setSearchQuery('');
  };

  const removeProduct = (productId: string) => {
    setSettings(prev => ({
      ...prev,
      productIds: prev.productIds.filter(id => id !== productId)
    }));
  };

  const getProductById = (id: string) => allProducts.find(p => p.id === id);
  const getProductImage = (product: Product) => {
    return product.productImages?.[0] || product.imageUrls?.[0] || '/placeholder.svg';
  };

  const filteredProducts = allProducts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    !settings.productIds.includes(p.id)
  );

  const SelectedIcon = ICON_OPTIONS.find(i => i.value === settings.icon)?.icon || Percent;

  if (loading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-primary" />
            Promo Banner Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure the promotional banner displayed on your homepage
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Changes
        </Button>
      </div>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {settings.enabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            Preview
          </CardTitle>
          <CardDescription>
            {settings.enabled ? 'This banner is currently visible on your homepage' : 'This banner is currently hidden'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.enabled ? (
            <div 
              className="relative overflow-hidden rounded-2xl p-6 md:p-8"
              style={{
                background: `linear-gradient(to right, ${settings.bgGradientFrom}, ${settings.bgGradientTo})`,
                color: settings.textColor
              }}
            >
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/20" />
                <div className="absolute -left-10 -bottom-10 w-32 h-32 rounded-full bg-white/20" />
              </div>
              
              <div className="relative flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/20">
                    <SelectedIcon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-2xl">{settings.title}</h3>
                    {settings.subtitle && <p className="text-sm md:text-base opacity-90">{settings.subtitle}</p>}
                  </div>
                </div>
                <span className="px-6 py-2.5 bg-white text-primary font-semibold rounded-full text-sm md:text-base">
                  {settings.ctaText}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-muted rounded-2xl p-8 text-center text-muted-foreground">
              <EyeOff className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Banner is currently disabled</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Settings</CardTitle>
            <CardDescription>Configure the banner content and appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enabled">Enable Banner</Label>
                <p className="text-sm text-muted-foreground">Show the promo banner on homepage</p>
              </div>
              <Switch
                id="enabled"
                checked={settings.enabled}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={settings.title}
                onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
                placeholder="🎉 Special Offers!"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={settings.subtitle}
                onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Get up to 30% off on selected items"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ctaText">Button Text</Label>
                <Input
                  id="ctaText"
                  value={settings.ctaText}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaText: e.target.value }))}
                  placeholder="Shop Deals"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ctaLink">Button Link</Label>
                <Input
                  id="ctaLink"
                  value={settings.ctaLink}
                  onChange={(e) => setSettings(prev => ({ ...prev, ctaLink: e.target.value }))}
                  placeholder="/products?filter=deals"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <Select 
                value={settings.icon} 
                onValueChange={(value: PromoBannerSettings['icon']) => setSettings(prev => ({ ...prev, icon: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      <div className="flex items-center gap-2">
                        <opt.icon className="h-4 w-4" />
                        {opt.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Customize the banner colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgGradientFrom">Gradient Start</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgGradientFrom"
                    type="color"
                    value={settings.bgGradientFrom}
                    onChange={(e) => setSettings(prev => ({ ...prev, bgGradientFrom: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.bgGradientFrom}
                    onChange={(e) => setSettings(prev => ({ ...prev, bgGradientFrom: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgGradientTo">Gradient End</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgGradientTo"
                    type="color"
                    value={settings.bgGradientTo}
                    onChange={(e) => setSettings(prev => ({ ...prev, bgGradientTo: e.target.value }))}
                    className="w-12 h-10 p-1 cursor-pointer"
                  />
                  <Input
                    value={settings.bgGradientTo}
                    onChange={(e) => setSettings(prev => ({ ...prev, bgGradientTo: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={settings.textColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                  className="w-12 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={settings.textColor}
                  onChange={(e) => setSettings(prev => ({ ...prev, textColor: e.target.value }))}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium mb-3">Quick Presets</h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    bgGradientFrom: '#4f46e5',
                    bgGradientTo: '#06b6d4',
                    textColor: '#ffffff'
                  }))}
                >
                  <div className="w-4 h-4 rounded mr-2" style={{ background: 'linear-gradient(to right, #4f46e5, #06b6d4)' }} />
                  Indigo-Cyan
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    bgGradientFrom: '#dc2626',
                    bgGradientTo: '#f97316',
                    textColor: '#ffffff'
                  }))}
                >
                  <div className="w-4 h-4 rounded mr-2" style={{ background: 'linear-gradient(to right, #dc2626, #f97316)' }} />
                  Red-Orange
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    bgGradientFrom: '#059669',
                    bgGradientTo: '#10b981',
                    textColor: '#ffffff'
                  }))}
                >
                  <div className="w-4 h-4 rounded mr-2" style={{ background: 'linear-gradient(to right, #059669, #10b981)' }} />
                  Green
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettings(prev => ({
                    ...prev,
                    bgGradientFrom: '#7c3aed',
                    bgGradientTo: '#ec4899',
                    textColor: '#ffffff'
                  }))}
                >
                  <div className="w-4 h-4 rounded mr-2" style={{ background: 'linear-gradient(to right, #7c3aed, #ec4899)' }} />
                  Purple-Pink
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deal Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Deal Products
          </CardTitle>
          <CardDescription>
            Select products to feature as deals. These products will appear when customers click the banner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Add Product Button */}
            <Popover open={productPopoverOpen} onOpenChange={setProductPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Deal Product
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <div className="p-3 border-b">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <ScrollArea className="h-64">
                  {filteredProducts.length === 0 ? (
                    <p className="text-center py-6 text-sm text-muted-foreground">
                      {searchQuery ? 'No products found' : 'All products added'}
                    </p>
                  ) : (
                    filteredProducts.slice(0, 20).map(product => (
                      <button
                        key={product.id}
                        className="w-full flex items-center gap-3 p-2 hover:bg-muted/50 transition-colors text-left"
                        onClick={() => addProduct(product.id)}
                      >
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">${product.price}</p>
                        </div>
                      </button>
                    ))
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Selected Products */}
            {settings.productIds.length === 0 ? (
              <div className="text-center py-8 bg-muted/30 rounded-lg">
                <Tag className="h-10 w-10 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-muted-foreground">No deal products selected</p>
                <p className="text-sm text-muted-foreground">Add products to feature in your deals</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {settings.productIds.map(productId => {
                  const product = getProductById(productId);
                  if (!product) return null;
                  return (
                    <div key={productId} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                        <Image
                          src={getProductImage(product)}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <button
                        onClick={() => removeProduct(productId)}
                        className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <p className="mt-1 text-xs truncate">{product.name}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {settings.productIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                <Badge variant="secondary">{settings.productIds.length}</Badge> products selected as deals
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
