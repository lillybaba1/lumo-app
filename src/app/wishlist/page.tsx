import { getWishlistByUser } from '@/services/wishlistService';
import { getProductById } from '@/services/productService';
import { Product } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingCart, Trash2, Shield, Truck, CreditCard, HeadphonesIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { WishlistButton } from '@/components/wishlist-button';
import { Badge } from '@/components/ui/badge';
import { getSettings } from '@/app/admin/settings/actions';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getCurrencySymbol } from '@/lib/currency';
import { PRODUCT_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils';

export const dynamic = 'force-dynamic';

function TrustBadges() {
  return (
    <div className="mt-8 w-full max-w-2xl mx-auto">
      <p className="text-sm text-muted-foreground mb-4 text-center">Why shop with JulaZone?</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <Shield className="h-6 w-6 text-green-600 mb-2" />
          <span className="text-xs font-medium text-center">Secure Payments</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <Truck className="h-6 w-6 text-blue-600 mb-2" />
          <span className="text-xs font-medium text-center">Fast Delivery</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <CreditCard className="h-6 w-6 text-purple-600 mb-2" />
          <span className="text-xs font-medium text-center">7-Day Refunds</span>
        </div>
        <div className="flex flex-col items-center p-3 rounded-lg bg-muted/50">
          <HeadphonesIcon className="h-6 w-6 text-orange-600 mb-2" />
          <span className="text-xs font-medium text-center">Local Support</span>
        </div>
      </div>
    </div>
  );
}

export default async function WishlistPage() {
  // Get current authenticated user
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  const currentUserId = user?.id;

  const settings = await getSettings();
  const currencySymbol = getCurrencySymbol(settings?.currency);

  if (!currentUserId) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-headline font-bold mb-4">Your Wishlist</h1>
          <p className="text-muted-foreground mb-6">
            Sign in to view and manage your wishlist.
          </p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <TrustBadges />
        </div>
      </div>
    );
  }

  const wishlist = await getWishlistByUser(currentUserId);

  if (!wishlist || wishlist.productIds.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-3xl font-headline font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-6">
            Start adding products to your wishlist by clicking the heart icon on any product.
          </p>
          <Button asChild>
            <Link href="/">Browse Products</Link>
          </Button>
          <TrustBadges />
        </div>
      </div>
    );
  }

  // Fetch all products in the wishlist
  const products = await Promise.all(
    wishlist.productIds.map(async (productId) => {
      const product = await getProductById(productId);
      return product;
    })
  );

  // Filter out null products (in case some were deleted)
  const validProducts = products.filter((p): p is Product => p !== null);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-headline font-bold mb-2">Your Wishlist</h1>
            <p className="text-muted-foreground">
              {validProducts.length} {validProducts.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {validProducts.map((product) => {
            const isOutOfStock = product.stock === 0;
            const isLowStock = product.stock > 0 && product.stock <= 5;

            return (
              <Card key={product.id} className="group relative overflow-hidden">
                <div className="absolute top-2 right-2 z-10">
                  <WishlistButton
                    productId={product.id}
                    productName={product.name}
                    currentUserId={currentUserId}
                    isInWishlist={true}
                  />
                </div>

                <Link href={`/products/${product.id}`}>
                  <div className="aspect-square relative bg-muted overflow-hidden">
                    <Image
                      src={
                        (product.productImages && product.productImages.length > 0)
                          ? product.productImages[0]
                          : (product.imageUrls && product.imageUrls.length > 0)
                            ? product.imageUrls[0]
                            : 'https://placehold.co/400x400.png'
                      }
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes={IMAGE_SIZES.productGrid}
                      placeholder="blur"
                      blurDataURL={PRODUCT_BLUR_DATA_URL}
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Badge variant="destructive">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                </Link>

                <CardContent className="pt-4">
                  <Link href={`/products/${product.id}`}>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                      <h3 className="font-semibold text-lg line-clamp-1 hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-bold text-primary">
                          {currencySymbol}{product.price.toFixed(2)}
                        </span>
                        {isLowStock && !isOutOfStock && (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            Only {product.stock} left
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="mt-4 flex gap-2">
                    <Button
                      asChild
                      className="flex-1"
                      disabled={isOutOfStock}
                    >
                      <Link href={`/products/${product.id}`}>
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        {isOutOfStock ? 'Out of Stock' : 'View Details'}
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
