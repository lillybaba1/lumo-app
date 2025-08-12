
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSettings } from '@/app/admin/settings/actions';

interface ProductCardProps {
  product: Product;
}
type Settings = { currency?: string };

export default function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});

  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));
  }, []);

  const currencySymbol = settings.currency ? (new Intl.NumberFormat('en-US', { style: 'currency', currency: settings.currency }).formatToParts(1).find(p => p.type === 'currency')?.value || '$') : '$';


  const handleAddToCart = () => {
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="aspect-square relative">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover"
            data-ai-hint={`${product.category} ${product.name.split(' ').slice(0,1).join(' ')}`}
          />
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="font-headline text-lg mb-2">{product.name}</CardTitle>
        <p className="text-muted-foreground text-sm">{product.description}</p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-xl font-bold">{currencySymbol}{product.price.toFixed(2)}</p>
        <Button onClick={handleAddToCart} size="sm">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
