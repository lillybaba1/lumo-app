import Link from 'next/link';
import { Home, Search, ShoppingBag, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-static';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="text-center max-w-md mx-auto">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="text-8xl font-bold text-primary/20 font-headline">404</div>
          <div className="relative -mt-12">
            <ShoppingBag className="w-24 h-24 mx-auto text-primary animate-bounce" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-3xl font-bold font-headline mb-3 text-foreground">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8 text-lg">
          Oops! The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-md"
          >
            <Home className="w-5 h-5" />
            Go to Homepage
          </Link>
          <Link
            href="/?search="
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-border bg-background font-semibold hover:bg-muted transition-colors"
          >
            <Search className="w-5 h-5" />
            Search Products
          </Link>
        </div>

        {/* Back Link */}
        <button 
          onClick={() => typeof window !== 'undefined' && window.history.back()}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back to previous page
        </button>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/products" className="text-primary hover:underline">
              All Products
            </Link>
            <Link href="/categories" className="text-primary hover:underline">
              Categories
            </Link>
            <Link href="/cart" className="text-primary hover:underline">
              Your Cart
            </Link>
            <Link href="/login" className="text-primary hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}