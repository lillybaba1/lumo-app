
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
import { WishlistButton } from '@/components/wishlist-button';

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
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const imageUrl = (product.productImages && product.productImages.length > 0)
    ? product.productImages[0]
    : (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls[0]
      : 'https://placehold.co/600x600.png';


  useEffect(() => {
    getSettings().then(s => setSettings(s || {}));

    // Fetch current user
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.user) {
          setCurrentUserId(data.user.uid);
        }
      })
      .catch(err => console.error('Error fetching user:', err));
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
        <Card
          className="group flex flex-col overflow-hidden h-full transition-all duration-300 hover:-translate-y-1 rounded-2xl border bg-white/80 shadow-sm hover:shadow-md"
        >
        <CardHeader className="p-0 relative">
            {/* Fixed 4:5 aspect ratio as per requirements */}
            <div className="relative" style={{ aspectRatio: '4/5' }}>
            <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
                data-ai-hint={`${product.category} ${product.name.split(' ').slice(0,1).join(' ')}`}
            />
            </div>
            {/* Wishlist button in top-right corner */}
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
              <WishlistButton
                productId={product.id}
                productName={product.name}
                currentUserId={currentUserId}
                isInWishlist={false}
              />
            </div>
        </CardHeader>
        <CardContent className="flex-grow p-4 flex flex-col min-w-0">
            <CardTitle
              className="text-lg mb-2 min-h-[2.5rem]"
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {product.name}
            </CardTitle>
            <p
              className="text-sm flex-grow line-clamp-2"
              style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 'var(--line-height-normal)',
              }}
            >
              {product.description}
            </p>
        </CardContent>
        <CardFooter className="p-4 flex flex-col gap-2 mt-auto">
            <div className="flex justify-between items-center w-full">
              <p
                className="text-xl font-bold whitespace-nowrap"
                style={{
                  color: 'var(--color-text-primary)',
                }}
              >
                {currencySymbol}{product.price.toFixed(2)}
              </p>
              {product.stock > 0 && product.stock <= 5 && (
                <span className="text-xs text-orange-600 font-medium">
                  Only {product.stock} left
                </span>
              )}
            </div>
            <Button
              onClick={handleAddToCart}
              size="sm"
              aria-label={`Add ${product.name} to cart`}
              className="w-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/90 text-white hover:bg-black rounded-xl"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span>Add to Cart</span>
            </Button>
        </CardFooter>
        </Card>
    </Link>
  );
}
