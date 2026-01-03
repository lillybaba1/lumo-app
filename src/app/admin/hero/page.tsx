"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, X, Move, Maximize2, Image as ImageIcon, ShoppingBag, ArrowRight } from 'lucide-react';
import { getHeroData, saveHeroData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { HeroData, HeroProduct, Product } from '@/lib/types';
import Image from 'next/image';

export default function HeroAdminPage() {
  const { toast } = useToast();
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [heroBackgroundImage, setHeroBackgroundImage] = useState<string>('');
  const [heroHeading, setHeroHeading] = useState<string>('Step into JulaZone');
  const [heroTagline, setHeroTagline] = useState<string>('Discover exceptional products crafted with care. Your journey to quality starts here.');
  // Button colors
  const [heroButton1BgColor, setHeroButton1BgColor] = useState<string>('#3b82f6');
  const [heroButton1TextColor, setHeroButton1TextColor] = useState<string>('#ffffff');
  const [heroButton2BgColor, setHeroButton2BgColor] = useState<string>('transparent');
  const [heroButton2TextColor, setHeroButton2TextColor] = useState<string>('#ffffff');
  const [heroButton2BorderColor, setHeroButton2BorderColor] = useState<string>('#ffffff');
  const [heroButton3BgColor, setHeroButton3BgColor] = useState<string>('#3b82f6');
  const [heroButton3TextColor, setHeroButton3TextColor] = useState<string>('#ffffff');
  // Hero Announcement
  const [heroAnnouncement, setHeroAnnouncement] = useState<{
    enabled: boolean;
    text: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
    borderRadius: number;
    fontSize: string;
    fontWeight: string;
    positionX: number;
    positionY: number;
    width: number;
    padding: string;
    shadow: boolean;
    animation: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);
  const [draggingLabel, setDraggingLabel] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [heroDataResult, productsData, settingsData] = await Promise.all([
        getHeroData(),
        fetch('/api/products', { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }).then(async (r) => {
          if (!r.ok) throw new Error(`Products request failed: ${r.status}`);
          return r.json();
        }),
        fetch('/api/settings?nocache=' + Date.now(), {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
          },
        }).then(async (r) => {
          if (!r.ok) throw new Error(`Settings request failed: ${r.status}`);
          return r.json();
        })
      ]);
      const mergedData = {
        heroLabelText: 'Featured',
        heroLabelPosition: { x: 10, y: 15 },
        products: [],
        ...(heroDataResult || {}),
      };
      setHeroData(mergedData);
      setAllProducts(Array.isArray(productsData) ? productsData : []);
      setHeroBackgroundImage(settingsData?.heroBackgroundImage || '');
      setHeroHeading(settingsData?.heroHeading || 'Step into JulaZone');
      setHeroTagline(settingsData?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.');
      // Load button colors
      setHeroButton1BgColor(settingsData?.heroButton1BgColor || '#3b82f6');
      setHeroButton1TextColor(settingsData?.heroButton1TextColor || '#ffffff');
      setHeroButton2BgColor(settingsData?.heroButton2BgColor || 'transparent');
      setHeroButton2TextColor(settingsData?.heroButton2TextColor || '#ffffff');
      setHeroButton2BorderColor(settingsData?.heroButton2BorderColor || '#ffffff');
      setHeroButton3BgColor(settingsData?.heroButton3BgColor || '#3b82f6');
      setHeroButton3TextColor(settingsData?.heroButton3TextColor || '#ffffff');
      // Load hero announcement settings
      setHeroAnnouncement({
        enabled: settingsData?.heroAnnouncementEnabled ?? false,
        text: settingsData?.heroAnnouncementText || '',
        bgColor: settingsData?.heroAnnouncementBgColor || '#4F46E5',
        textColor: settingsData?.heroAnnouncementTextColor || '#ffffff',
        borderColor: settingsData?.heroAnnouncementBorderColor || '#ffffff',
        borderRadius: settingsData?.heroAnnouncementBorderRadius ?? 12,
        fontSize: settingsData?.heroAnnouncementFontSize || 'base',
        fontWeight: settingsData?.heroAnnouncementFontWeight || 'semibold',
        positionX: settingsData?.heroAnnouncementPositionX ?? 50,
        positionY: settingsData?.heroAnnouncementPositionY ?? 10,
        width: settingsData?.heroAnnouncementWidth ?? 400,
        padding: settingsData?.heroAnnouncementPadding || 'md',
        shadow: settingsData?.heroAnnouncementShadow ?? true,
        animation: settingsData?.heroAnnouncementAnimation || 'none',
      });
    } catch (error) {
      console.error('Failed to load data:', error);
      setHeroData({ products: [], heroLabelText: 'Featured', heroLabelPosition: { x: 10, y: 15 } });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!heroData) return;
    setIsSaving(true);
    try {
      const result = await saveHeroData(heroData);
      
      if (result.success) {
        toast({
          title: "Hero Updated",
          description: "Your hero products have been saved.",
        });
      } else {
        if (result.error === 'Invalid hero data') {
          toast({
            title: "Validation Error",
            description: "Please check hero label and product positions/sizes.",
            variant: "destructive"
          });
          console.error('Validation details:', result.details);
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to save hero data.",
            variant: "destructive"
          });
        }
      }
    } catch (error: any) {
      console.error('Unexpected error saving hero data:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addProduct = (productId: string) => {
    if (!heroData) return;

    // Check if product already exists
    if (heroData.products.some(p => p.productId === productId)) {
      toast({
        title: "Product Already Added",
        description: "This product is already on the hero.",
        variant: "destructive"
      });
      return;
    }

    const newHeroProduct: HeroProduct = {
      id: Date.now().toString(),
      productId,
      position: { x: 50, y: 50 }, // Center by default
      size: { width: 200, height: 200 },
      displayOrder: heroData.products.length,
      createdAt: new Date().toISOString()
    };

    setHeroData({
      ...heroData,
      products: [...heroData.products, newHeroProduct]
    });
    setSearchOpen(false);
    setSearchQuery('');
  };

  const removeProduct = (id: string) => {
    if (!heroData) return;
    setHeroData({
      ...heroData,
      products: heroData.products.filter(p => p.id !== id)
    });
  };

  const updateLabelText = (text: string) => {
    if (!heroData) return;
    setHeroData({ ...heroData, heroLabelText: text });
  };

  const handleMouseDown = (e: React.MouseEvent, id: string, type: 'drag' | 'resize') => {
    e.preventDefault();
    if (type === 'drag') {
      setDraggingId(id);
    } else {
      setResizingId(id);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!heroData || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();

    if (draggingLabel) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setHeroData({
        ...heroData,
        heroLabelPosition: {
          x: Math.max(0, Math.min(100, x)),
          y: Math.max(0, Math.min(100, y)),
        }
      });
    }

    if (draggingId) {
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setHeroData({
        ...heroData,
        products: heroData.products.map(p =>
          p.id === draggingId
            ? { ...p, position: { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } }
            : p
        )
      });
    }

    if (resizingId) {
      const product = heroData.products.find(p => p.id === resizingId);
      if (!product) return;

      const productRect = container.querySelector(`[data-product-id="${resizingId}"]`)?.getBoundingClientRect();
      if (!productRect) return;

      const width = Math.max(100, e.clientX - productRect.left);
      const height = Math.max(100, e.clientY - productRect.top);

      setHeroData({
        ...heroData,
        products: heroData.products.map(p =>
          p.id === resizingId
            ? { ...p, size: { width, height } }
            : p
        )
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingId(null);
    setResizingId(null);
    setDraggingLabel(false);
  };

  const getProductById = (id: string) => allProducts.find(p => p.id === id);
  const availableProducts = allProducts.filter(p => !heroData?.products.some(hp => hp.productId === p.id));
  const filteredProducts = availableProducts.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold">Manage Hero Products</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Hero Products</h1>
          <p className="text-muted-foreground mt-1">
            Position and resize products to display on your homepage hero
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Add Products
            </CardTitle>
            <CardDescription>
              Search and add products to the hero
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
              </div>

              {searchOpen && (
                <ScrollArea className="h-[400px] border rounded-lg">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No products found.
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredProducts.slice(0, 50).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => addProduct(product.id)}
                          className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left"
                        >
                          <div className="w-12 h-12 relative bg-muted rounded flex-shrink-0">
                            {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                              <Image
                                src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">${product.price.toFixed(2)}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm font-semibold mb-2">Selected Products ({heroData?.products.length || 0})</p>
                {heroData?.products.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No products added yet</p>
                ) : (
                  <div className="space-y-2">
                    {heroData?.products.map((heroProduct) => {
                      const product = getProductById(heroProduct.productId);
                      if (!product) return null;
                      return (
                        <div key={heroProduct.id} className="flex items-center gap-2 p-2 bg-muted rounded">
                          <div className="w-8 h-8 relative bg-background rounded flex-shrink-0">
                            {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                              <Image
                                src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                                alt={product.name}
                                fill
                                className="object-cover rounded"
                                unoptimized
                              />
                            )}
                          </div>
                          <span className="flex-1 text-xs truncate">{product.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => removeProduct(heroProduct.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Area */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Hero Preview</CardTitle>
            <CardDescription>
              Drag products to position them, use the resize handle in the bottom-right corner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              ref={containerRef}
              className="relative w-full aspect-[2/1] bg-gradient-to-r from-slate-800 to-slate-600 rounded-lg overflow-hidden"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: draggingId || resizingId ? 'grabbing' : 'default' }}
            >
              {/* Background */}
              {heroBackgroundImage ? (
                <div
                  className="absolute inset-0 bg-cover bg-no-repeat"
                  style={{ backgroundImage: `url(${heroBackgroundImage})`, backgroundPosition: 'center' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-600">
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                    <div className="text-center text-white">
                      <ImageIcon className="h-16 w-16 mx-auto mb-2" />
                      <p className="text-sm">Set hero background in Appearance</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Hero Content - Heading, Tagline, CTAs */}
              <div className="absolute left-6 top-1/2 -translate-y-1/2 max-w-[45%] pointer-events-none z-[1]">
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{heroHeading}</h2>
                <p className="text-white/80 text-sm mb-4 line-clamp-2">{heroTagline}</p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="gap-1 text-xs pointer-events-none"
                    style={{
                      backgroundColor: heroButton1BgColor,
                      color: heroButton1TextColor,
                    }}
                  >
                    Shop New Arrivals
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs pointer-events-none"
                    style={{
                      backgroundColor: heroButton2BgColor,
                      color: heroButton2TextColor,
                      borderColor: heroButton2BorderColor,
                    }}
                  >
                    Browse Collections
                  </Button>
                </div>
              </div>

              {/* Hero Announcement Overlay Preview */}
              {heroAnnouncement?.enabled && heroAnnouncement?.text && (
                <div
                  className={`absolute text-center z-20 ${
                    heroAnnouncement.animation === 'pulse' ? 'animate-pulse' :
                    heroAnnouncement.animation === 'bounce' ? 'animate-bounce' :
                    heroAnnouncement.animation === 'shake' ? 'animate-shake' : ''
                  }`}
                  style={{
                    left: `${heroAnnouncement.positionX}%`,
                    top: `${heroAnnouncement.positionY}%`,
                    transform: heroAnnouncement.positionX === 50 ? 'translateX(-50%)' : 
                               heroAnnouncement.positionX > 50 ? `translateX(-${(heroAnnouncement.positionX - 50) * 2}%)` : 'none',
                    width: `${Math.min(heroAnnouncement.width * 0.3, 150)}px`,
                    backgroundColor: heroAnnouncement.bgColor,
                    color: heroAnnouncement.textColor,
                    borderColor: heroAnnouncement.borderColor,
                    borderWidth: '2px',
                    borderStyle: 'solid',
                    borderRadius: `${heroAnnouncement.borderRadius}px`,
                    padding: heroAnnouncement.padding === 'sm' ? '2px 6px' :
                             heroAnnouncement.padding === 'lg' ? '8px 16px' : '4px 10px',
                    fontSize: '9px',
                    fontWeight: heroAnnouncement.fontWeight === 'normal' ? 400 :
                                heroAnnouncement.fontWeight === 'medium' ? 500 :
                                heroAnnouncement.fontWeight === 'bold' ? 700 : 600,
                    boxShadow: heroAnnouncement.shadow ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '200px',
                  }}
                >
                  {heroAnnouncement.text}
                </div>
              )}

              {/* Label - styled like homepage */}
              {heroData?.heroLabelText && (
                <div
                  className="absolute cursor-move group"
                  style={{
                    left: `${heroData.heroLabelPosition?.x ?? 10}%`,
                    top: `${heroData.heroLabelPosition?.y ?? 15}%`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10,
                  }}
                  onMouseDown={(e) => { e.preventDefault(); setDraggingLabel(true); }}
                >
                  <Button
                    size="sm"
                    className="font-semibold text-xs gap-1.5 rounded-full shadow-lg cursor-move"
                    style={{
                      backgroundColor: heroButton3BgColor,
                      color: heroButton3TextColor,
                    }}
                  >
                    <ShoppingBag className="h-3 w-3" />
                    {heroData.heroLabelText}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                  {/* Drag indicator on hover */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/75 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    <Move className="h-3 w-3 inline mr-1" />
                    Drag to move
                  </div>
                </div>
              )}

              {/* Product overlays */}
              {heroData?.products.map((heroProduct) => {
                const product = getProductById(heroProduct.productId);
                if (!product) return null;

                return (
                  <div
                    key={heroProduct.id}
                    data-product-id={heroProduct.id}
                    className="absolute group"
                    style={{
                      left: `${heroProduct.position.x}%`,
                      top: `${heroProduct.position.y}%`,
                      width: `${heroProduct.size.width}px`,
                      height: `${heroProduct.size.height}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: draggingId === heroProduct.id ? 'grabbing' : 'grab',
                    }}
                  >
                    {/* Product Card */}
                    <div className="relative w-full h-full bg-white rounded-lg shadow-lg overflow-hidden border-2 border-primary/50">
                      <div className="absolute inset-0">
                        {(product.productImages?.[0] || product.imageUrls?.[0]) && (
                          <Image
                            src={product.productImages?.[0] || product.imageUrls?.[0] || ''}
                            alt={product.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        )}
                      </div>

                      {/* Product info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs font-semibold truncate">{product.name}</p>
                        <p className="text-white/80 text-xs">${product.price.toFixed(2)}</p>
                      </div>

                      {/* Drag handle */}
                      <div
                        className="absolute top-2 right-2 bg-primary/90 p-1.5 rounded cursor-move opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, heroProduct.id, 'drag')}
                      >
                        <Move className="h-3 w-3 text-primary-foreground" />
                      </div>

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-1 right-1 bg-primary/90 p-1 rounded cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => handleMouseDown(e, heroProduct.id, 'resize')}
                      >
                        <Maximize2 className="h-3 w-3 text-primary-foreground" />
                      </div>

                      {/* Remove button */}
                      <button
                        className="absolute top-2 left-2 bg-destructive/90 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeProduct(heroProduct.id)}
                      >
                        <X className="h-3 w-3 text-destructive-foreground" />
                      </button>
                    </div>

                    {/* Position indicator */}
                    <Badge
                      variant="secondary"
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {Math.round(heroProduct.position.x)}%, {Math.round(heroProduct.position.y)}%
                    </Badge>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Label Text</label>
                  <Input
                    value={heroData?.heroLabelText || ''}
                    onChange={(e) => updateLabelText(e.target.value)}
                    placeholder="Featured"
                  />
                  <p className="text-xs text-muted-foreground">Drag the pill on the preview to position it.</p>
                </div>
              </div>
              <p className="text-sm font-semibold mb-2">Instructions:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Click the <Move className="inline h-3 w-3" /> icon to drag and position a product</li>
                <li>• Click the <Maximize2 className="inline h-3 w-3" /> icon to resize a product</li>
                <li>• Click the <X className="inline h-3 w-3" /> icon to remove a product</li>
                <li>• Products will appear as overlays on your hero image</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
