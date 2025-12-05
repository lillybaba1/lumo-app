
import { notFound } from 'next/navigation';
import { getProductById } from '@/services/productService';
import { getReviewsByProduct, getProductStats, getUserReviewForProduct } from '@/services/reviewService';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package, TruckIcon, Store, BadgeCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { getSettings } from '@/app/admin/settings/actions';
import { StarRating } from '@/components/star-rating';
import { ProductReviews } from '@/components/product-reviews';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AddToCartButton from './add-to-cart-button';
import { WishlistButton } from '@/components/wishlist-button';
import { getCurrentUser } from '@/lib/auth-admin';
import { isInWishlist } from '@/services/wishlistService';
import { getUserById } from '@/services/userService';

async function getCurrencySymbol(currencyCode: string | undefined) {
    if (!currencyCode) return '$';
    if (currencyCode === 'GMD') return 'D';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currencyCode }).formatToParts(1).find(p => p.type === 'currency')?.value || '$';
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, reviews, stats, settings] = await Promise.all([
    getProductById(id),
    getReviewsByProduct(id),
    getProductStats(id),
    getSettings(),
  ]);

  if (!product) {
    notFound();
  }

  const currencySymbol = await getCurrencySymbol(settings?.currency);

  // Get current user info
  const currentUser = await getCurrentUser();
  const currentUserId = currentUser?.userId;
  const currentUserName = currentUser?.userId ? (await getUserById(currentUser.userId))?.name : undefined;
  const userReview = currentUserId ? await getUserReviewForProduct(currentUserId, id) : null;
  const productInWishlist = currentUserId ? await isInWishlist(currentUserId, id) : false;

  const isLowStock = product.stock > 0 && product.stock <= 5;
  const isOutOfStock = product.stock === 0;

  // Use productImages if available, otherwise fall back to imageUrls for backwards compatibility
  const baseDisplayImages = product.productImages && product.productImages.length > 0
    ? product.productImages
    : product.imageUrls;

  // Add cache-buster to Supabase storage images
  const displayImages = baseDisplayImages.map(url =>
    url.includes('supabase.co/storage')
      ? (url.includes('?') ? `${url}&v=${product.id}` : `${url}?v=${product.id}`)
      : url
  );

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Product Images */}
        <div>
          <Card className="overflow-hidden">
            <Carousel className="w-full">
              <CarouselContent>
                {displayImages.map((url, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative bg-muted">
                      <Image
                        src={url}
                        alt={`${product.name} - Image ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 600px"
                        priority={index === 0}
                        loading={index === 0 ? undefined : "lazy"}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {displayImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </Card>
        </div>

        {/* Product Info */}
        <div className="flex flex-col space-y-6">
          {/* Category Badge */}
          <div>
            <Badge variant="secondary" className="mb-2">
              {product.category}
            </Badge>
          </div>

          {/* Product Name */}
          <div>
            <h1 className="text-4xl font-headline font-bold mb-3">{product.name}</h1>

            {/* Rating */}
            {stats.totalReviews > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={stats.averageRating} size="md" showNumber />
                <span className="text-sm text-muted-foreground">
                  ({stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            )}
          </div>

          {/* Price */}
          <div>
            <p className="text-3xl font-bold text-primary">{currencySymbol}{product.price.toFixed(2)}</p>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          </div>

          <Separator />

          {/* Stock Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Availability:</span>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                  Only {product.stock} left!
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                  In Stock ({product.stock} available)
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TruckIcon className="h-4 w-4" />
              <span>Free shipping on orders over {currencySymbol}50</span>
            </div>
          </div>

          <Separator />

          {/* Add to Cart & Wishlist */}
          <div className="pt-4 space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <AddToCartButton product={product} />
              </div>
              <WishlistButton
                productId={product.id}
                productName={product.name}
                currentUserId={currentUserId}
                isInWishlist={productInWishlist}
                variant="button"
                size="default"
              />
            </div>
            {isOutOfStock && (
              <p className="text-sm text-muted-foreground">
                This product is currently out of stock. Check back later!
              </p>
            )}
          </div>

          {/* Additional Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                {/* Seller Info */}
                {product.sellerName && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Store className="h-4 w-4" />
                      Sold by:
                    </span>
                    {product.boutiqueSlug ? (
                      <Link 
                        href={`/boutique/${product.boutiqueSlug}`}
                        className="font-bold flex items-center gap-1.5 text-primary hover:underline transition-colors"
                      >
                        <Store className="h-4 w-4" />
                        {product.sellerName}
                        {product.sellerVerified && (
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </Link>
                    ) : (
                      <span className="font-medium flex items-center gap-1">
                        {product.sellerName}
                        {product.sellerVerified && (
                          <BadgeCheck className="h-4 w-4 text-blue-500" />
                        )}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">SKU:</span>
                  <span className="font-medium">{product.id.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="font-medium">{product.category}</span>
                </div>
                {stats.totalSales > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Sales:</span>
                    <span className="font-medium">{stats.totalSales}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="max-w-4xl mx-auto">
        <ProductReviews
          productId={id}
          reviews={reviews}
          averageRating={stats.averageRating}
          totalReviews={stats.totalReviews}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          userHasReviewed={!!userReview}
        />
      </div>
    </div>
  );
}
