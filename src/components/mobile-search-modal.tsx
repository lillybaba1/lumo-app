"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, ArrowRight, Store } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrls?: string[];
  productImages?: string[];
}

interface Boutique {
  id: string;
  slug: string;
  displayName: string;
  tagline?: string;
  logo?: string;
  totalProducts: number;
}

interface MobileSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchModal({ isOpen, onClose }: MobileSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [boutiqueSuggestions, setBoutiqueSuggestions] = useState<Boutique[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  }, [isOpen]);

  // Save search to recent
  const saveRecentSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setBoutiqueSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [productsRes, boutiquesRes] = await Promise.all([
          fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`),
          fetch(`/api/boutiques/search?q=${encodeURIComponent(query)}&limit=3`)
        ]);
        
        if (productsRes.ok) {
          const data = await productsRes.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 5) : (data.products || []).slice(0, 5));
        }
        
        if (boutiquesRes.ok) {
          const data = await boutiquesRes.json();
          setBoutiqueSuggestions(Array.isArray(data) ? data.slice(0, 3) : (data.boutiques || []).slice(0, 3));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle back button in Capacitor
  useEffect(() => {
    if (!isOpen) return;
    
    const setupBackButton = async () => {
      try {
        const { App } = await import('@capacitor/app');
        
        const listener = await App.addListener('backButton', () => {
          // Close modal instead of going back
          onClose();
        });

        return () => {
          listener.remove();
        };
      } catch (error) {
        // Not running in Capacitor
      }
    };

    const cleanup = setupBackButton();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      router.push(`/?search=${encodeURIComponent(query.trim())}`);
      onClose();
      setQuery('');
    }
  };

  const handleSuggestionClick = (product: Product) => {
    saveRecentSearch(product.name);
    router.push(`/products/${product.id}`);
    onClose();
    setQuery('');
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    router.push(`/?search=${encodeURIComponent(search)}`);
    onClose();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getProductImage = (product: Product) => {
    return product.productImages?.[0] || product.imageUrls?.[0] || 'https://placehold.co/100x100.png';
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-white flex flex-col"
      data-mobile-search-modal="true"
    >
      {/* Header with search input */}
      <div 
        className="flex items-center gap-3 px-4 py-2 border-b bg-white sticky top-0"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-9 pr-9 h-10 text-base rounded-lg border-input bg-muted/30 focus:bg-background"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </form>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground px-2 h-10"
        >
          Cancel
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading state */}
        {loading && (
          <div className="p-6 text-center text-muted-foreground">
            <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
            Searching...
          </div>
        )}

        {/* Suggestions */}
        {!loading && (suggestions.length > 0 || boutiqueSuggestions.length > 0) && (
          <div className="p-4">
            {/* Boutique suggestions */}
            {boutiqueSuggestions.length > 0 && (
              <>
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <Store className="h-3 w-3" />
                  Boutiques
                </div>
                <div className="space-y-1 mb-4">
                  {boutiqueSuggestions.map((boutique) => (
                    <Link
                      key={boutique.id}
                      href={`/boutique/${boutique.slug}`}
                      onClick={() => {
                        saveRecentSearch(boutique.displayName);
                        onClose();
                        setQuery('');
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-primary/10 flex-shrink-0 flex items-center justify-center">
                        {boutique.logo ? (
                          <Image
                            src={boutique.logo}
                            alt={boutique.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <Store className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{boutique.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {boutique.tagline || `${boutique.totalProducts} products`}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              </>
            )}
            
            {/* Product suggestions */}
            {suggestions.length > 0 && (
              <>
                <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <TrendingUp className="h-3 w-3" />
                  Products
                </div>
                <div className="space-y-1">
                  {suggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(product)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={getProductImage(product)}
                          alt={product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">
                        ${product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
            
            {query && (
              <button
                onClick={() => {
                  saveRecentSearch(query);
                  router.push(`/?search=${encodeURIComponent(query)}`);
                  onClose();
                }}
                className="flex items-center justify-between w-full p-3 text-sm text-primary hover:bg-primary/5 rounded-xl transition-colors mt-2"
              >
                <span>View all results for &ldquo;{query}&rdquo;</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* No results */}
        {!loading && query.length >= 2 && suggestions.length === 0 && boutiqueSuggestions.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No products or boutiques found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Initial View: Recent, Trending, Categories */}
        {!loading && query.length < 2 && (
          <div className="p-4 space-y-6 pb-20">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="px-2 flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  <span className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    Recent Searches
                  </span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-primary hover:underline hover:text-primary/80"
                  >
                    Clear
                  </button>
                </div>
                <div className="space-y-0.5">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentClick(search)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 active:bg-muted transition-colors text-left group"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Clock className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                        <span className="text-sm truncate">{search}</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 -translate-x-1 group-hover:translate-x-0 group-hover:text-primary/50 transition-all opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending / Popular Searches */}
            <div className="space-y-3">
              <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-orange-500" />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2 px-1">
                {[
                  "Nike Air Force", "Samsung Galaxy", "Home Decor", 
                  "Summer Dresses", "Smart Watches", "Headphones",
                  "Skin Care", "Running Shoes"
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      saveRecentSearch(term);
                      router.push(`/?search=${encodeURIComponent(term)}`);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-muted/40 hover:bg-primary/10 hover:text-primary hover:border-primary/20 border border-transparent rounded-full text-sm transition-all"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Categories */}
            <div className="space-y-3">
              <div className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <Store className="h-3.5 w-3.5 text-blue-500" />
                Browse Categories
              </div>
              <div className="grid grid-cols-2 gap-2.5 px-1">
                {[
                  { id: 'fashion', name: 'Fashion', icon: '👗', color: 'bg-pink-50 text-pink-700' },
                  { id: 'electronics', name: 'Electronics', icon: '📱', color: 'bg-blue-50 text-blue-700' },
                  { id: 'home', name: 'Home & Living', icon: '🏠', color: 'bg-green-50 text-green-700' },
                  { id: 'beauty', name: 'Beauty', icon: '💄', color: 'bg-purple-50 text-purple-700' },
                  { id: 'sports', name: 'Sports', icon: '⚽', color: 'bg-orange-50 text-orange-700' },
                  { id: 'toys', name: 'Toys & Games', icon: '🎮', color: 'bg-indigo-50 text-indigo-700' },
                ].map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.id}`}
                    onClick={onClose}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/50 hover:border-primary/20 transition-all group"
                  >
                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-lg ${cat.color} bg-opacity-50`}>
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium group-hover:text-primary transition-colors">{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
