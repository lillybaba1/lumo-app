import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBoutiqueBySlug, getBoutiqueProducts } from '@/services/boutiqueService';
import { getBusinessAccount } from '@/services/businessAccountService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Store, Star, Package, ShoppingBag, MapPin, Mail, Phone, 
  Globe, Instagram, Facebook, Twitter, CheckCircle, Shield 
} from 'lucide-react';
import ProductCard from '@/components/product-card';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const boutique = await getBoutiqueBySlug(slug);
  
  if (!boutique) {
    return { title: 'Boutique Not Found' };
  }

  return {
    title: `${boutique.displayName} | Lumo`,
    description: boutique.tagline || boutique.description || `Shop at ${boutique.displayName}`,
    openGraph: {
      title: boutique.displayName,
      description: boutique.tagline || `Shop at ${boutique.displayName}`,
      images: boutique.bannerImage ? [boutique.bannerImage] : [],
    },
  };
}

export default async function BoutiquePage({ params }: Props) {
  const { slug } = await params;
  const boutique = await getBoutiqueBySlug(slug);

  if (!boutique || !boutique.isPublished) {
    notFound();
  }

  const businessAccount = await getBusinessAccount(boutique.businessAccountId);
  const products = await getBoutiqueProducts(boutique.id, { limit: 12 });

  const isVerified = businessAccount?.verificationStatus === 'verified';
  const isEnterprise = businessAccount?.subscriptionTier === 'enterprise';

  return (
    <div className="min-h-screen bg-background">
      {/* Banner */}
      <div 
        className="relative h-48 md:h-64 lg:h-80 bg-gradient-to-r from-primary/20 to-accent/20"
        style={{ 
          backgroundColor: boutique.themeColor,
        }}
      >
        {boutique.bannerImage && (
          <Image
            src={boutique.bannerImage}
            alt={`${boutique.displayName} banner`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      {/* Boutique Header */}
      <div className="container px-4 md:px-6">
        <div className="relative -mt-16 md:-mt-20 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Logo */}
            <div 
              className="w-24 h-24 md:w-32 md:h-32 rounded-xl border-4 border-background bg-card shadow-lg flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: boutique.themeColor }}
            >
              {boutique.logo ? (
                <Image
                  src={boutique.logo}
                  alt={boutique.displayName}
                  width={128}
                  height={128}
                  className="object-cover w-full h-full"
                />
              ) : (
                <Store className="h-12 w-12 md:h-16 md:w-16 text-white" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-headline font-bold text-foreground">
                  {boutique.displayName}
                </h1>
                {isVerified && (
                  <Badge className="bg-blue-500 text-white gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {isEnterprise && (
                  <Badge className="bg-purple-500 text-white gap-1">
                    <Shield className="h-3 w-3" />
                    Premium Seller
                  </Badge>
                )}
                {boutique.isFeatured && (
                  <Badge variant="secondary" className="gap-1">
                    <Star className="h-3 w-3" />
                    Featured
                  </Badge>
                )}
              </div>
              {boutique.tagline && (
                <p className="text-muted-foreground text-lg">{boutique.tagline}</p>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <div className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{boutique.totalProducts}</span>
                  <span className="text-muted-foreground">Products</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{boutique.totalSales}</span>
                  <span className="text-muted-foreground">Sales</span>
                </div>
                {boutique.totalReviews > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-medium">{boutique.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({boutique.totalReviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Social Links */}
            {boutique.socialLinks && Object.keys(boutique.socialLinks).length > 0 && (
              <div className="flex gap-2">
                {boutique.socialLinks.instagram && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={boutique.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {boutique.socialLinks.facebook && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={boutique.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                {boutique.socialLinks.twitter && (
                  <Button variant="outline" size="icon" asChild>
                    <a href={boutique.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8 pb-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            {boutique.description && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm text-muted-foreground">{boutique.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Contact */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <h3 className="font-semibold">Contact</h3>
                {boutique.contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${boutique.contactEmail}`} className="hover:underline">
                      {boutique.contactEmail}
                    </a>
                  </div>
                )}
                {boutique.contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${boutique.contactPhone}`} className="hover:underline">
                      {boutique.contactPhone}
                    </a>
                  </div>
                )}
                {businessAccount?.businessAddress && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{businessAccount.businessAddress}</span>
                  </div>
                )}
                {businessAccount?.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a 
                      href={businessAccount.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Policies */}
            {(boutique.shippingInfo || boutique.returnPolicy) && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  {boutique.shippingInfo && (
                    <div>
                      <h3 className="font-semibold mb-1">Shipping</h3>
                      <p className="text-sm text-muted-foreground">{boutique.shippingInfo}</p>
                    </div>
                  )}
                  {boutique.returnPolicy && (
                    <div>
                      <h3 className="font-semibold mb-1">Returns</h3>
                      <p className="text-sm text-muted-foreground">{boutique.returnPolicy}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Products</h2>
              <span className="text-muted-foreground text-sm">
                {boutique.totalProducts} items
              </span>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-1">No products yet</h3>
                  <p className="text-muted-foreground text-sm">
                    This boutique hasn't added any products yet. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}

            {products.length > 0 && boutique.totalProducts > 12 && (
              <div className="text-center mt-8">
                <Button variant="outline" asChild>
                  <Link href={`/boutique/${slug}/products`}>
                    View All Products
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
