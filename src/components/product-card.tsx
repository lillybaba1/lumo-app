
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
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
}
type Settings = { currency?: string };

function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default function ProductCard({ product }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({});
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/600x600.png';


  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));
  }, []);

  const currencySymbol = getCurrencySymbol(settings?.currency);


  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation when clicking the button
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Link href={`/products/${product.id}`} className="flex flex-col h-full">
        <Card className="flex flex-col overflow-hidden h-full rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="p-0">
            <div className="aspect-square relative">
            <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                data-ai-hint={`${product.category} ${product.name.split(' ').slice(0,1).join(' ')}`}
            />
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-4 flex flex-col">
            <CardTitle className="font-headline text-lg mb-2 min-h-[2.5rem]">{product.name}</CardTitle>
            <p className="text-muted-foreground text-sm flex-grow line-clamp-2">{product.description}</p>
        </CardContent>
        <CardFooter className="p-4 flex justify-between items-center mt-auto">
            <p className="text-xl font-bold">{currencySymbol}{product.price.toFixed(2)}</p>
            <Button onClick={handleAddToCart} size="sm">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
            </Button>
        </CardFooter>
        </Card>
    </Link>
  );
}
