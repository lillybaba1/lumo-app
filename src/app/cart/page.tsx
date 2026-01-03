
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/use-cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, Minus, Plus } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useEffect, useState } from 'react';
import { getSettings } from '../admin/settings/actions';
import { getCurrencySymbol } from '@/lib/currency';

type Settings = { currency?: string };

export default function CartPage() {
  const { state, dispatch } = useCart();
  const { items } = state;
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));
  }, []);

  const currencySymbol = getCurrencySymbol(settings?.currency);


  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity: Math.max(1, quantity) } });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const getProductImage = (product: { productImages?: string[]; imageUrls?: string[]; category?: string }) => {
    if (product.productImages && product.productImages.length > 0) {
      return product.productImages[0];
    }
    if (product.imageUrls && product.imageUrls.length > 0) {
      return product.imageUrls[0];
    }
    return 'https://placehold.co/600x600.png';
  };

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-2xl md:text-3xl font-headline font-bold mb-6 md:mb-8">Your Shopping Cart</h1>
        {items.length === 0 ? (
          <EmptyState 
            title="Oops! Your cart is empty."
            description="Looks like you haven't added anything to your cart yet. Start browsing to find something you love."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-12">
            <div className="lg:col-span-2">
              {/* Mobile Card Layout */}
              <div className="md:hidden space-y-4">
                {items.map(({ product, quantity }) => (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <Image
                            src={getProductImage(product)}
                            alt={product.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                            unoptimized
                          />
                        </div>
                        
                        {/* Product Info */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm leading-tight truncate pr-2">
                              {product.name}
                            </h3>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 -mt-1 -mr-2 text-muted-foreground hover:text-destructive"
                              onClick={() => removeItem(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {currencySymbol}{product.price.toFixed(2)} each
                          </p>
                          
                          {/* Quantity and Total */}
                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">{quantity}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <p className="font-semibold text-primary">
                              {currencySymbol}{(product.price * quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <Card className="hidden md:block">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Product</TableHead>
                        <TableHead></TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map(({ product, quantity }) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <Image
                              src={getProductImage(product)}
                              alt={product.name}
                              width={80}
                              height={80}
                              className="rounded-md"
                              unoptimized
                              data-ai-hint={`${product.category} product`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{product.name}</TableCell>
                          <TableCell>{currencySymbol}{product.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                disabled={quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{currencySymbol}{(product.price * quantity).toFixed(2)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="hover:text-destructive"
                              onClick={() => removeItem(product.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary - Sticky on mobile */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                    <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{currencySymbol}{subtotal.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button asChild className="w-full" size="lg">
                    <Link href="/checkout">
                      Proceed to Checkout <ShoppingCart className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/">
                      Continue Shopping
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
