"use client";

import { AppSidebar, SidebarSection } from '@/components/app-sidebar';
import { Home, Grid, Sparkles, Star, Tag, Heart, ShoppingCart, User, HelpCircle, Mail, Sparkles as SparklesIcon } from 'lucide-react';

const sections: SidebarSection[] = [
  {
    label: 'Browse',
    items: [
      { label: 'Home', icon: Home, href: '/' },
      { label: 'All Products', icon: Grid, href: '/products' },
      { label: 'New Arrivals', icon: Sparkles, href: '/products?filter=new' },
      { label: 'Best Sellers', icon: Star, href: '/products?filter=bestsellers' },
      { label: 'Deals & Offers', icon: Tag, href: '/products?filter=deals' },
    ],
  },
  {
    label: 'My Account',
    items: [
      { label: 'Wishlist', icon: Heart, href: '/wishlist' },
      { label: 'Shopping Cart', icon: ShoppingCart, href: '/cart' },
      { label: 'Sign In', icon: User, href: '/login' },
    ],
  },
  {
    label: 'Support',
    items: [
      { label: 'Help Center', icon: HelpCircle, href: '/pages/faq' },
      { label: 'Contact Us', icon: Mail, href: '/pages/contact' },
    ],
  },
];

export default function PublicSidebar() {
  return (
    <AppSidebar
      sections={sections}
      mobileTitle="Browse Lumo"
      mobileIcon={
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <SparklesIcon className="h-5 w-5" />
        </div>
      }
      mobileOffsetClassName="top-16"
      header={({ collapsed }) => (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
            <SparklesIcon className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-base font-bold font-headline">Lumo</span>
              <span className="text-xs text-muted-foreground">Shop & Discover</span>
            </div>
          )}
        </>
      )}
      footer={({ collapsed }) =>
        !collapsed ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <p>© 2025 Lumo. All rights reserved.</p>
          </div>
        ) : null
      }
    />
  );
}
