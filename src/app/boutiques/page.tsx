import Link from 'next/link';
import Image from 'next/image';
import { getPublishedBoutiques } from '@/services/boutiqueService';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Store, Star, Package, ShoppingBag, CheckCircle, Shield, Sparkles, ArrowRight, Search } from 'lucide-react';

export const metadata = {
  title: 'Discover Boutiques | JulaZone',
  description: 'Explore unique boutiques and shops from verified sellers on JulaZone',
};

// ISR: Revalidate boutiques page every 5 minutes for fresh data without SSR overhead
export const revalidate = 300;

export default async function BoutiquesPage() {
  const featuredBoutiques = await getPublishedBoutiques({ featured: true, limit: 4 });
  const allBoutiques = await getPublishedBoutiques({ limit: 20 });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero with better styling */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-accent/5 to-background py-16 md:py-24">
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container px-4 md:px-6 text-center relative z-10">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3 mr-1" />
            Discover Unique Sellers
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Explore Boutiques
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto mb-8">
            Shop from our curated collection of unique boutiques, each offering handpicked 
            products from verified sellers across the globe.
          </p>
          
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{allBoutiques.length}+</div>
              <div className="text-sm text-muted-foreground">Active Boutiques</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{featuredBoutiques.length}</div>
              <div className="text-sm text-muted-foreground">Featured Sellers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-6 py-12">
        {/* Featured Boutiques */}
        {featuredBoutiques.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-600 dark:text-yellow-400 fill-yellow-500" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Featured Boutiques</h2>
                  <p className="text-sm text-muted-foreground">Handpicked sellers with exceptional products</p>
                </div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBoutiques.map((boutique) => (
                <BoutiqueCard key={boutique.id} boutique={boutique} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Boutiques */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">All Boutiques</h2>
                <p className="text-sm text-muted-foreground">Browse our complete collection of sellers</p>
              </div>
            </div>
          </div>
          {allBoutiques.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {allBoutiques.map((boutique) => (
                <BoutiqueCard key={boutique.id} boutique={boutique} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed border-2">
              <CardContent className="py-16 text-center">
                <div className="relative w-20 h-20 mx-auto mb-6">
                  <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
                  <div className="absolute inset-2 bg-primary/5 rounded-full flex items-center justify-center">
                    <Store className="h-8 w-8 text-primary/60" />
                  </div>
                </div>
                <h3 className="font-bold text-xl mb-2">No Boutiques Yet</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">
                  Be the first to open your boutique! Sign up as a seller to get started.
                </p>
                <Button asChild>
                  <Link href="/signup">Start Selling Today</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* CTA for sellers */}
        <section className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-none">
            <CardContent className="py-12 text-center">
              <Store className="h-12 w-12 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-headline font-bold mb-2">
                Start Your Own Boutique
              </h2>
              <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                Join our marketplace and showcase your products to thousands of customers. 
                Create your branded boutique and start selling today.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Become a Seller
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

function BoutiqueCard({ boutique, featured = false }: { boutique: any; featured?: boolean }) {
  // Generate store initials for avatar fallback
  const storeInitials = boutique.displayName
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Link href={`/boutique/${boutique.slug}`}>
      <Card className={`group overflow-hidden hover:shadow-xl transition-all duration-300 h-full ${featured ? 'ring-2 ring-yellow-400/50' : 'hover:ring-2 hover:ring-primary/20'}`}>
        {/* Banner */}
        <div 
          className="h-28 bg-gradient-to-br from-primary/30 via-primary/20 to-accent/20 relative overflow-hidden"
          style={{ backgroundColor: boutique.themeColor }}
        >
          {boutique.bannerImage && (
            <Image
              src={boutique.bannerImage}
              alt=""
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
          {/* Logo/Avatar */}
          <div 
            className="absolute -bottom-7 left-4 w-14 h-14 rounded-xl border-3 border-background bg-card shadow-lg flex items-center justify-center overflow-hidden ring-2 ring-background"
            style={{ backgroundColor: boutique.themeColor || '#4F46E5' }}
          >
            {boutique.logo ? (
              <Image
                src={boutique.logo}
                alt={boutique.displayName}
                width={56}
                height={56}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-lg font-bold text-white">{storeInitials}</span>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 right-2 flex gap-1">
            {featured && (
              <Badge className="bg-yellow-500/90 text-white text-xs gap-1">
                <Sparkles className="h-3 w-3" />
                Featured
              </Badge>
            )}
            {boutique.isVerified && (
              <Badge className="bg-blue-500/90 text-white text-xs">
                <CheckCircle className="h-3 w-3" />
              </Badge>
            )}
          </div>
        </div>

        <CardContent className="pt-10 pb-5">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors line-clamp-1">
              {boutique.displayName}
            </h3>
          </div>
          
          {boutique.tagline && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
              {boutique.tagline}
            </p>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Package className="h-3.5 w-3.5" />
              <span className="font-medium">{boutique.totalProducts}</span>
              <span>products</span>
            </div>
            {boutique.totalReviews > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                <span className="font-medium">{boutique.averageRating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
