'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { COUNTRIES, type Country } from '@/lib/countries';
import { ChevronDown, Search } from 'lucide-react';

interface CountryPickerProps {
  value: string; // ISO country code e.g. 'GM'
  onChange: (country: Country) => void;
  className?: string;
}

export function CountryPicker({ value, onChange, className = '' }: CountryPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => COUNTRIES.find(c => c.code === value) || COUNTRIES[0], [value]);

  const filtered = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase();
    return COUNTRIES.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.dialCode.includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  }, [search]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  // Focus search when opened
  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(''); }}
        className="flex items-center gap-1.5 h-11 px-3 border rounded-md bg-background hover:bg-muted/50 transition-colors text-sm w-full min-w-[120px]"
      >
        <span className="text-lg leading-none">{selected.flag}</span>
        <span className="font-medium">{selected.dialCode}</span>
        <ChevronDown className={`h-3.5 w-3.5 ml-auto text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 max-h-64 bg-background border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b sticky top-0 bg-background">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search country..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-8 pl-8 pr-3 text-sm bg-muted/50 border rounded-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Country list */}
          <div className="overflow-y-auto max-h-48">
            {filtered.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No countries found</div>
            ) : (
              filtered.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => {
                    onChange(country);
                    setOpen(false);
                    setSearch('');
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted/70 transition-colors ${
                    country.code === value ? 'bg-primary/5 text-primary font-medium' : ''
                  }`}
                >
                  <span className="text-lg leading-none">{country.flag}</span>
                  <span className="flex-1 text-left truncate">{country.name}</span>
                  <span className="text-muted-foreground text-xs">{country.dialCode}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
