"use client";

import { Home, Search, ShoppingCart, Package, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/hooks/use-cart';
import { Badge } from './ui/badge';
import { useState } from 'react';
import MobileSearchModal from './mobile-search-modal';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  action?: 'search';
}

const navItems: NavItem[] = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '#', icon: Search, label: 'Search', action: 'search' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart' },
  { href: '/orders', icon: Package, label: 'Orders' },
  { href: '/account/profile', icon: User, label: 'Account' },
];

export default function BottomNavigation() {
  const pathname = usePathname();
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const [searchOpen, setSearchOpen] = useState(false);

  // Hide on admin/business dashboards
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/business')) {
    return null;
  }

  return (
    <>
      {/* Fixed Bottom Navigation - Mobile Only */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.action ? false : pathname === item.href;
            const isCart = item.href === '/cart';

            if (item.action === 'search') {
              return (
                <button
                  key={item.label}
                  onClick={() => setSearchOpen(true)}
                  className="flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors text-gray-500 hover:text-primary"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full px-2 transition-colors relative ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {isCart && itemCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[9px] font-bold"
                    >
                      {itemCount > 99 ? '99+' : itemCount}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] mt-0.5 font-medium">{item.label}</span>
                {isActive && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Add padding at bottom to prevent content from being hidden behind nav */}
      <div 
        className="md:hidden" 
        style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }} 
      />

      {/* Search Modal */}
      <MobileSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
