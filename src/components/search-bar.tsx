"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrls?: string[];
  productImages?: string[];
}

interface SearchBarProps {
  variant?: 'header' | 'hero' | 'full';
  placeholder?: string;
  className?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ 
  variant = 'header', 
  placeholder = 'Search products...', 
  className = '',
  onSearch 
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
  }, []);

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
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(Array.isArray(data) ? data.slice(0, 5) : (data.products || []).slice(0, 5));
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/?search=${encodeURIComponent(query.trim())}`);
      }
      setIsOpen(false);
    }
  };

  const handleSuggestionClick = (product: Product) => {
    saveRecentSearch(product.name);
    router.push(`/products/${product.id}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleRecentClick = (search: string) => {
    setQuery(search);
    if (onSearch) {
      onSearch(search);
    } else {
      router.push(`/?search=${encodeURIComponent(search)}`);
    }
    setIsOpen(false);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  const getProductImage = (product: Product) => {
    return product.productImages?.[0] || product.imageUrls?.[0] || 'https://placehold.co/100x100.png';
  };

  // Variant styles
  const variantStyles = {
    header: 'w-full max-w-md',
    hero: 'w-full max-w-2xl',
    full: 'w-full',
  };

  const inputStyles = {
    header: 'h-10 pl-10 pr-4 text-sm rounded-full bg-muted/50 border-0 focus:bg-white focus:ring-2 focus:ring-primary/20',
    hero: 'h-14 pl-12 pr-14 text-base rounded-full bg-white/95 backdrop-blur-sm shadow-lg border-0 focus:ring-2 focus:ring-primary/30',
    full: 'h-12 pl-11 pr-4 text-base rounded-xl bg-white border focus:ring-2 focus:ring-primary/20',
  };

  return (
    <div ref={containerRef} className={`relative ${variantStyles[variant]} ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <Search 
          className={`absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground ${
            variant === 'hero' ? 'h-5 w-5 left-4' : 'h-4 w-4'
          }`} 
        />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={inputStyles[variant]}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${
              variant === 'hero' ? 'right-14' : 'right-3'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {variant === 'hero' && (
          <Button 
            type="submit" 
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-4 rounded-full"
          >
            <Search className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Dropdown */}
      {isOpen && (query.length >= 2 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
          {/* Loading state */}
          {loading && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2" />
              Searching...
            </div>
          )}

          {/* Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <TrendingUp className="h-3 w-3" />
                Products
              </div>
              {suggestions.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleSuggestionClick(product)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <Image
                      src={getProductImage(product)}
                      alt={product.name}
                      fill
                      sizes="48px"
                      className="object-cover"
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
              {query && (
                <Link
                  href={`/?search=${encodeURIComponent(query)}`}
                  onClick={() => {
                    saveRecentSearch(query);
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-3 text-sm text-primary hover:bg-primary/5 rounded-xl transition-colors mt-1"
                >
                  <span>View all results for "{query}"</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          )}

          {/* No results */}
          {!loading && query.length >= 2 && suggestions.length === 0 && (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No products found for "{query}"
            </div>
          )}

          {/* Recent searches */}
          {!loading && query.length < 2 && recentSearches.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center justify-between">
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
              {recentSearches.map((search, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentClick(search)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted/50 transition-colors text-left"
                >
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{search}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
