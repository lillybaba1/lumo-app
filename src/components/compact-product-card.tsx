"use client";

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/use-cart';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Star, Truck, BadgeCheck } from 'lucide-react';
import { useSettings } from '@/context/settings-context';
import { getCurrencySymbol } from '@/lib/currency';
import { PRODUCT_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';

interface CompactProductCardProps {
  product: Product;
  index?: number;
}

export default function CompactProductCard({ product, index = 999 }: CompactProductCardProps) {
  const { dispatch } = useCart();
  const { toast } = useToast();
  const { settings } = useSettings();
  const isPriority = index < 6;
  
  // Detect mock/sample products
  const isMock = product.sellerId === 'mock-seller' || product.sellerId === 'mock-seller-id' || product.category === 'mock';
  
  // Get image URL
  const baseImageUrl = (product.productImages && product.productImages.length > 0)
    ? product.productImages[0]
    : (product.imageUrls && product.imageUrls.length > 0)
      ? product.imageUrls[0]
      : 'https://placehold.co/300x300.png';

  const imageUrl = baseImageUrl.includes('supabase.co/storage')
    ? (baseImageUrl.includes('?') ? `${baseImageUrl}&v=${product.id}` : `${baseImageUrl}?v=${product.id}`)
    : baseImageUrl;

  // Product data
  const productRating = (product as { averageRating?: number }).averageRating || 0;
  const productReviews = (product as { totalReviews?: number }).totalReviews || 0;
  const currencySymbol = getCurrencySymbol(settings?.currency);
  
  // Calculate discount (mock for now - can be connected to real data)
  const originalPrice = (product as { originalPrice?: number }).originalPrice;
  const hasDiscount = originalPrice && originalPrice > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'ADD_ITEM', payload: product });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Link href={`/products/${product.id}`} className="block">
      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        {/* Image Container - Square aspect, contain to view full product */}
        <div className="relative aspect-square bg-white">
          <Image
            src={imageUrl}
            alt={product.name}
            fill
            className="object-contain p-2"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={isPriority}
            loading={isPriority ? undefined : "lazy"}
            placeholder="blur"
            blurDataURL={PRODUCT_BLUR_DATA_URL}
          />
          
          {/* Discount Badge */}
          {hasDiscount && discountPercent > 0 && (
            <div className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{discountPercent}%
            </div>
          )}

          {/* Sample Badge */}
          {isMock && !hasDiscount && (
            <div className="absolute top-1 left-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              Sample
            </div>
          )}
          {isMock && hasDiscount && (
            <div className="absolute top-1 right-1 bg-amber-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide">
              Sample
            </div>
          )}

          {/* Out of Stock Overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-white text-gray-900 text-[10px] font-bold px-2 py-1 rounded">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-2 flex-1 flex flex-col">
          {/* Product Name - 2 lines max */}
          <h3 className="text-[11px] leading-tight font-medium text-gray-900 line-clamp-2 mb-1 min-h-[28px]">
            {product.name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-1">
            {productRating > 0 ? (
              <>
                <div className="flex items-center">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-[10px] font-medium text-gray-700 ml-0.5">
                    {productRating.toFixed(1)}
                  </span>
                </div>
                {productReviews > 0 && (
                  <span className="text-[10px] text-gray-400">
                    ({productReviews})
                  </span>
                )}
              </>
            ) : (
              <span className="text-[10px] text-gray-400">No reviews yet</span>
            )}
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-sm font-bold text-gray-900">
              {currencySymbol}{product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                {currencySymbol}{originalPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Trust Signals */}
          <div className="flex flex-wrap gap-1 mb-2">
            <div className="flex items-center gap-0.5 text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
              <Truck className="h-2.5 w-2.5" />
              <span>Fast delivery</span>
            </div>
            {product.stock > 0 && product.stock <= 5 && (
              <div className="text-[9px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                Only {product.stock} left
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Add to Cart Button */}
          <Button
            onClick={handleAddToCart}
            size="sm"
            disabled={product.stock === 0}
            className="w-full h-7 text-[10px] font-medium bg-primary hover:bg-primary/90"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </div>
      </div>
    </Link>
  );
}
