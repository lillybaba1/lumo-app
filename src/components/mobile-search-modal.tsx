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
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header with search input */}
      <div className="flex items-center gap-3 p-4 border-b bg-white sticky top-0">
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products..."
            className="pl-10 pr-10 h-12 text-base rounded-full border-2 focus:border-primary"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </form>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClose}
          className="text-muted-foreground font-medium"
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
                        ${product.price.toFixed(2)}
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
                <span>View all results for "{query}"</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* No results */}
        {!loading && query.length >= 2 && suggestions.length === 0 && boutiqueSuggestions.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            No products or boutiques found for "{query}"
          </div>
        )}

        {/* Recent searches */}
        {!loading && query.length < 2 && recentSearches.length > 0 && (
          <div className="p-4">
            <div className="px-2 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Recent Searches
              </span>
              <button
                onClick={clearRecentSearches}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
            <div className="space-y-1">
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && query.length < 2 && recentSearches.length === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Start typing to search products</p>
          </div>
        )}
      </div>
    </div>
  );
}
