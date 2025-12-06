import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getBoutiqueBySlug, getBoutiqueProducts } from '@/services/boutiqueService';
import { getBusinessAccount } from '@/services/businessAccountService';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  Store, Star, Package, ShoppingBag, MapPin, Mail, Phone, 
  Globe, Instagram, Facebook, Twitter, CheckCircle, Shield,
  Sparkles, Clock, Truck, ArrowRight, Heart, Share2, MessageCircle,
  Users
} from 'lucide-react';
import ProductCard from '@/components/product-card';
import { BoutiqueSocialButtons, FollowButton } from '@/components/boutique-social-buttons';
import { BoutiqueComments } from '@/components/boutique-comments';

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

  const [businessAccount, products, supabase] = await Promise.all([
    getBusinessAccount(boutique.businessAccountId),
    getBoutiqueProducts(boutique.id, { limit: 12 }),
    createClient(),
  ]);

  const { data: { user } } = await supabase.auth.getUser();
  const isAuthenticated = !!user;
  const currentUserId = user?.id;

  const isVerified = businessAccount?.verificationStatus === 'verified';
  const isEnterprise = businessAccount?.subscriptionTier === 'enterprise';
  const isPro = businessAccount?.subscriptionTier === 'pro';

  // Generate store initials for avatar fallback
  const storeInitials = boutique.displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      {/* Banner with Animated Gradient */}
      <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
        {/* Animated gradient background */}
        <div 
          className="absolute inset-0 bg-gradient-to-br from-primary via-primary/80 to-accent animate-gradient-slow"
          style={{ 
            background: boutique.themeColor 
              ? `linear-gradient(135deg, ${boutique.themeColor} 0%, ${boutique.themeColor}cc 50%, ${boutique.themeColor}99 100%)`
              : undefined,
          }}
        />
        {/* Pattern overlay for visual interest */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        {boutique.bannerImage && (
          <Image
            src={boutique.bannerImage}
            alt={`${boutique.displayName} banner`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        {/* Share button on banner */}
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="secondary" size="sm" className="bg-white/90 hover:bg-white backdrop-blur-sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </div>

      {/* Boutique Header */}
      <div className="container px-4 md:px-6">
        <div className="relative -mt-20 md:-mt-24 mb-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            {/* Logo/Avatar with better styling */}
            <div 
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-4 border-background bg-card shadow-xl flex items-center justify-center overflow-hidden ring-4 ring-background/50"
              style={{ backgroundColor: boutique.themeColor || '#8b5cf6' }}
            >
              {boutique.logo ? (
                <Image
                  src={boutique.logo}
                  alt={boutique.displayName}
                  width={144}
                  height={144}
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <span className="text-3xl md:text-4xl font-bold text-white">
                    {storeInitials}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 pb-2">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl md:text-4xl font-headline font-bold text-foreground">
                  {boutique.displayName}
                </h1>
                {isVerified && (
                  <Badge className="bg-blue-500/90 text-white gap-1 px-2 py-1">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Verified Seller
                  </Badge>
                )}
                {isEnterprise && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white gap-1 px-2 py-1">
                    <Shield className="h-3.5 w-3.5" />
                    Premium Partner
                  </Badge>
                )}
                {isPro && !isEnterprise && (
                  <Badge className="bg-amber-500 text-white gap-1 px-2 py-1">
                    <Star className="h-3.5 w-3.5" />
                    Pro Seller
                  </Badge>
                )}
                {boutique.isFeatured && (
                  <Badge variant="secondary" className="gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    Featured
                  </Badge>
                )}
              </div>
              
              {boutique.tagline && (
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
                  {boutique.tagline}
                </p>
              )}
              
              {/* Stats with better visuals */}
              <div className="flex flex-wrap gap-6 mt-4">
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-bold text-lg">{products.length}</span>
                  <span className="text-muted-foreground">Products</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                  <ShoppingBag className="h-5 w-5 text-green-600" />
                  <span className="font-bold text-lg">{boutique.totalSales}</span>
                  <span className="text-muted-foreground">Sales</span>
                </div>
                {(boutique.followerCount || 0) > 0 && (
                  <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-lg">{boutique.followerCount}</span>
                    <span className="text-muted-foreground">Followers</span>
                  </div>
                )}
                {boutique.totalReviews > 0 && (
                  <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-bold text-lg">{boutique.averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({boutique.totalReviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <BoutiqueSocialButtons 
                boutiqueId={boutique.id} 
                isAuthenticated={isAuthenticated}
                initialLikeCount={boutique.likeCount || 0}
                initialFollowerCount={boutique.followerCount || 0}
              />
              {/* Social Links */}
              {boutique.socialLinks?.instagram && (
                <Button variant="outline" size="icon" className="rounded-full" asChild>
                  <a href={boutique.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                    <Instagram className="h-5 w-5" />
                  </a>
                </Button>
              )}
              {boutique.socialLinks?.facebook && (
                <Button variant="outline" size="icon" className="rounded-full" asChild>
                  <a href={boutique.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                    <Facebook className="h-5 w-5" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-4 gap-8 pb-12">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* About Card with better styling */}
            {boutique.description && (
              <Card className="overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="pt-5">
                  <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" />
                    About Us
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">{boutique.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Store Highlights */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold text-lg">Why Shop With Us</h3>
                <div className="space-y-3">
                  {isVerified && (
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Verified Seller</p>
                        <p className="text-xs text-muted-foreground">Identity & business verified</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Truck className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fast Shipping</p>
                      <p className="text-xs text-muted-foreground">Quick & reliable delivery</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                      <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Responsive Support</p>
                      <p className="text-xs text-muted-foreground">We're here to help</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Card with better styling */}
            <Card>
              <CardContent className="pt-5 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" />
                  Contact
                </h3>
                <div className="space-y-3">
                  {/* In-App Message Button */}
                  {isAuthenticated && (
                    <Link
                      href={`/messages?boutique=${boutique.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Message Seller</span>
                    </Link>
                  )}
                  {!isAuthenticated && (
                    <Link
                      href={`/login?redirect=/boutique/${slug}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Sign in to message seller</span>
                    </Link>
                  )}
                  {boutique.contactEmail && (
                    <a 
                      href={`mailto:${boutique.contactEmail}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm truncate">{boutique.contactEmail}</span>
                    </a>
                  )}
                  {boutique.contactPhone && (
                    <a 
                      href={`tel:${boutique.contactPhone}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{boutique.contactPhone}</span>
                    </a>
                  )}
                  {boutique.whatsapp && (
                    <a 
                      href={`https://wa.me/${boutique.whatsapp.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-700 dark:text-green-400">Chat on WhatsApp</span>
                    </a>
                  )}
                  {(boutique.storeAddress || boutique.storeLocation || boutique.storeCity) && (
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-sm text-muted-foreground">
                        {boutique.storeAddress && <p>{boutique.storeAddress}</p>}
                        {(boutique.storeCity || boutique.storeCountry) && (
                          <p>{[boutique.storeCity, boutique.storeCountry].filter(Boolean).join(', ')}</p>
                        )}
                        {boutique.storeLocation && <p className="text-xs mt-1">{boutique.storeLocation}</p>}
                      </div>
                    </div>
                  )}
                  {boutique.businessHours && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{boutique.businessHours}</span>
                    </div>
                  )}
                  {businessAccount?.website && (
                    <a 
                      href={businessAccount.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Visit Website</span>
                      <ArrowRight className="h-3 w-3 ml-auto" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Trust & Credibility */}
            {(boutique.establishedYear || boutique.specializations?.length || boutique.acceptedPayments?.length || boutique.trustBadges?.length) && (
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    About This Seller
                  </h3>
                  <div className="space-y-3">
                    {boutique.establishedYear && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Established:</span>
                        <span className="font-medium">{boutique.establishedYear}</span>
                      </div>
                    )}
                    {boutique.specializations && boutique.specializations.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Specializes in:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {boutique.specializations.map((spec: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {boutique.acceptedPayments && boutique.acceptedPayments.length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Accepts:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {boutique.acceptedPayments.map((payment: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {payment}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {boutique.trustBadges && boutique.trustBadges.length > 0 && (
                      <div className="pt-2 border-t">
                        <div className="flex flex-wrap gap-2">
                          {boutique.trustBadges.map((badge: string, idx: number) => (
                            <div key={idx} className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              {badge}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Policies */}
            {(boutique.shippingInfo || boutique.returnPolicy) && (
              <Card>
                <CardContent className="pt-5 space-y-4">
                  {boutique.shippingInfo && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        Shipping
                      </h3>
                      <p className="text-sm text-muted-foreground">{boutique.shippingInfo}</p>
                    </div>
                  )}
                  {boutique.returnPolicy && (
                    <div>
                      <h3 className="font-semibold mb-2">Returns & Refunds</h3>
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
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" />
                Products
              </h2>
              <Badge variant="outline" className="text-base px-3 py-1">
                {products.length} items
              </Badge>
            </div>

            {products.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {products.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              /* Enhanced Empty State */
              <Card className="border-dashed border-2">
                <CardContent className="py-16 text-center">
                  <div className="relative w-24 h-24 mx-auto mb-6">
                    <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                    <div className="absolute inset-2 bg-primary/5 rounded-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-primary/60" />
                    </div>
                  </div>
                  <h3 className="font-bold text-xl mb-2">Coming Soon!</h3>
                  <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                    {boutique.displayName} is preparing amazing products for you. 
                    Follow this boutique to get notified when new items arrive!
                  </p>
                  <FollowButton 
                    boutiqueId={boutique.id} 
                    isAuthenticated={isAuthenticated}
                  />
                </CardContent>
              </Card>
            )}

            {products.length > 0 && boutique.totalProducts > 12 && (
              <div className="text-center mt-8">
                <Button variant="outline" size="lg" asChild className="gap-2">
                  <Link href={`/boutique/${slug}/products`}>
                    View All {boutique.totalProducts} Products
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Comments Section */}
            <div className="mt-12">
              <BoutiqueComments
                boutiqueId={boutique.id}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
