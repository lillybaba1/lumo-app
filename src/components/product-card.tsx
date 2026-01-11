
"use client";

import Image from 'next/image';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useState } from 'react';
import { useSettings } from '@/context/settings-context';
import Link from 'next/link';
import { WishlistButton } from '@/components/wishlist-button';
import { getCurrencySymbol } from '@/lib/currency';
import { PRODUCT_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';

interface ProductCardProps {
  product: Product;
  showQuickView?: boolean;
  compact?: boolean;
  /** Position index for priority loading (first 4 load eagerly) */
  index?: number;
}

// Star rating display component
function StarRating({ rating = 0, reviews = 0, size = 'sm' }: { rating?: number; reviews?: number; size?: 'sm' | 'md' }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  
  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      stars.push(<Star key={i} className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`} />);
    } else if (i === fullStars && hasHalfStar) {
      stars.push(
        <div key={i} className="relative">
          <Star className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-gray-200`} />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} fill-yellow-400 text-yellow-400`} />
          </div>
        </div>
      );
    } else {
      stars.push(<Star key={i} className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} text-gray-200`} />);
    }
  }
  
  return (
    <div className="flex items-center gap-1">
      <div className="flex">{stars}</div>
      {reviews > 0 && (
        <span className={`text-muted-foreground ${size === 'sm' ? 'text-[10px]' : 'text-xs'}`}>
          ({reviews})
        </span>
      )}
    </div>
  );
}

export default function ProductCard({ product, showQuickView = true, compact = false, index = 999 }: ProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const { settings, auth } = useSettings();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if this image should load with priority (above the fold)
  const isPriority = index < 4;
  
  // Get base image URL
  const baseImageUrl = (product.productImages && product.productImages.length > 0)
    ? product.productImages[0]
    : (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls[0]
      : 'https://placehold.co/600x600.png';

  // Add cache-buster to Supabase storage images to prevent browser caching
  const imageUrl = baseImageUrl.includes('supabase.co/storage')
    ? (baseImageUrl.includes('?') ? `${baseImageUrl}&v=${product.id}` : `${baseImageUrl}?v=${product.id}`)
    : baseImageUrl;

  // Use real review data if available, otherwise don't show reviews
  // Products with no reviews should show no rating
  const productRating = (product as { averageRating?: number }).averageRating || 0;
  const productReviews = (product as { totalReviews?: number }).totalReviews || 0;

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
          className="group flex flex-col overflow-hidden h-full transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg rounded-lg md:rounded-2xl border bg-white/90 shadow-sm"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
        <CardHeader className="p-0 relative overflow-hidden">
            {/* Square aspect ratio for compact/mobile view to fit more content */}
            <div className="relative aspect-square">
            <Image
                src={imageUrl}
                alt={product.name}
                fill
                className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                sizes={IMAGE_SIZES.productGrid}
                priority={isPriority}
                loading={isPriority ? undefined : "lazy"}
                placeholder="blur"
                blurDataURL={PRODUCT_BLUR_DATA_URL}
                data-ai-hint={`${product.category} ${product.name.split(' ').slice(0,1).join(' ')}`}
            />
            {/* Gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            
            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {product.stock === 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] md:text-xs font-medium rounded-full">
                  Out of Stock
                </span>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <span className="px-2 py-0.5 bg-orange-500 text-white text-[10px] md:text-xs font-medium rounded-full">
                  Low Stock
                </span>
              )}
            </div>
            
            {/* Wishlist button in top-right corner */}
            <div className="absolute top-2 right-2 z-10" onClick={(e) => e.preventDefault()}>
              <WishlistButton
                productId={product.id}
                productName={product.name}
                currentUserId={auth.userId}
                isInWishlist={false}
              />
            </div>

            {/* Quick view button on hover - hidden in compact mode */}
            {showQuickView && !compact && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-10">
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white/95 backdrop-blur-sm hover:bg-white shadow-md rounded-full px-4 h-8 text-xs font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    // Could open a quick view modal here
                  }}
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  Quick View
                </Button>
              </div>
            )}
        </CardHeader>
        <CardContent className={`flex-grow flex flex-col min-w-0 ${compact ? 'p-1.5' : 'p-1.5 md:p-4'}`}>
            <CardTitle
              className={`leading-tight line-clamp-2 font-semibold ${compact ? 'text-[10px] md:text-xs mb-0' : 'text-[11px] md:text-base mb-0.5 md:mb-1.5 min-h-[1.75rem] md:min-h-[2.5rem]'}`}
              style={{
                fontFamily: 'var(--font-heading)',
                color: 'var(--color-text-primary)',
              }}
            >
              {product.name}
            </CardTitle>
            
            {/* Star Rating - hidden in compact mode */}
            {!compact && productReviews > 0 && (
              <div className="mb-1 md:mb-2 hidden md:block">
                <StarRating rating={productRating} reviews={productReviews} size="sm" />
              </div>
            )}
            
            {!compact && (
              <p
                className="text-xs md:text-sm flex-grow hidden md:line-clamp-2 text-muted-foreground"
              >
                {product.description}
              </p>
            )}
        </CardContent>
        <CardFooter className={`flex flex-col mt-auto pt-0 ${compact ? 'p-1.5 gap-1' : 'p-1.5 md:p-4 gap-1 md:gap-2'}`}>
            <div className="flex flex-col w-full gap-0.5">
              <div className="flex justify-between items-center">
                <p
                  className={`font-bold whitespace-nowrap ${compact ? 'text-xs' : 'text-xs md:text-xl'}`}
                  style={{
                    color: 'var(--color-text-primary)',
                  }}
                >
                  {currencySymbol}{product.price.toFixed(2)}
                </p>
                {!compact && product.stock > 0 && product.stock <= 5 && (
                  <span className="text-[8px] md:text-xs text-orange-600 font-medium whitespace-nowrap ml-2">
                    Only {product.stock} left
                  </span>
                )}
              </div>
              {/* Mobile star rating - hidden in compact mode */}
              {!compact && productReviews > 0 && (
                <div className="md:hidden">
                  <StarRating rating={productRating} reviews={productReviews} size="sm" />
                </div>
              )}
            </div>
            {/* Compact mode: smaller add button */}
            {compact ? (
              <Button
                onClick={handleAddToCart}
                size="sm"
                disabled={product.stock === 0}
                aria-label={`Add ${product.name} to cart`}
                className="w-full bg-primary hover:bg-primary/90 text-white rounded-lg h-6 text-[9px] font-medium"
              >
                <ShoppingCart className="mr-1 h-3 w-3" />
                <span>Add</span>
              </Button>
            ) : (
              <Button
                onClick={handleAddToCart}
                size="sm"
                disabled={product.stock === 0}
                aria-label={`Add ${product.name} to cart`}
                className="w-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 bg-primary hover:bg-primary/90 text-white rounded-lg md:rounded-xl h-7 md:h-9 text-[9px] md:text-sm font-medium shadow-sm"
              >
                <ShoppingCart className="mr-1 md:mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden md:inline">{product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}</span>
                <span className="md:hidden">{product.stock === 0 ? 'Out' : 'Add'}</span>
              </Button>
            )}
        </CardFooter>
        </Card>
    </Link>
  );
}
