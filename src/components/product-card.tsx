
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
  const imageUrl = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'https://placehold.co/600x600.png';


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
          className="flex flex-col overflow-hidden h-full transition-all duration-300 group"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--card-border)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-card)';
          }}
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
        <CardFooter className="p-4 flex flex-col sm:flex-row justify-between items-center mt-auto gap-2 min-w-0">
            <p
              className="text-xl whitespace-nowrap"
              style={{
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-text-primary)',
              }}
            >
              {currencySymbol}{product.price.toFixed(2)}
            </p>
            <Button
              onClick={handleAddToCart}
              size="sm"
              aria-label={`Add ${product.name} to cart`}
              className="w-full sm:w-auto flex items-center justify-center px-2 sm:px-3 whitespace-normal min-w-0"
              style={{
                backgroundColor: 'var(--button-primary-bg)',
                color: 'var(--button-primary-fg)',
                borderRadius: 'var(--radius-button)',
              }}
            >
              <ShoppingCart className="mr-2 h-4 w-4 shrink-0" />
              <span className="hidden md:inline truncate max-w-[6.5rem]">Add to Cart</span>
            </Button>
        </CardFooter>
        </Card>
    </Link>
  );
}
