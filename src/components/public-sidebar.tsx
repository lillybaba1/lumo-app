"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AppSidebar, SidebarSection } from '@/components/app-sidebar';
import { Home, Grid, Clock, Star, Tag, Heart, ShoppingCart, User, HelpCircle, Mail, ShoppingBag, LogOut, Package } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  uid: string;
  email: string;
  role: string;
  name: string;
}

export default function PublicSidebar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
      setAuthChecked(true);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  // Build dynamic sections based on auth state
  const sections: SidebarSection[] = [
    {
      label: 'Browse',
      items: [
        { label: 'Home', icon: Home, href: '/' },
        { label: 'All Products', icon: Grid, href: '/products' },
        { label: 'New Arrivals', icon: ShoppingBag, href: '/products?filter=new' },
        { label: 'Best Sellers', icon: Star, href: '/products?filter=bestsellers' },
        { label: 'Deals & Offers', icon: Tag, href: '/products?filter=deals' },
      ],
    },
    {
      label: 'My Account',
      items: authChecked && isAuthenticated && user
        ? [
            { label: 'Wishlist', icon: Heart, href: '/wishlist' },
            { label: 'Shopping Cart', icon: ShoppingCart, href: '/cart' },
            { label: 'My Orders', icon: Package, href: '/orders' },
            { label: 'My Profile', icon: User, href: '/account/profile' },
          ]
        : [
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

  return (
    <AppSidebar
      sections={sections}
      mobileTitle="JulaZone"
      mobileIcon={
        <Image 
          src="/icon.svg" 
          alt="JulaZone" 
          width={32} 
          height={32} 
          className="rounded-lg"
        />
      }
      mobileOffsetClassName="top-[56px]"
      header={({ collapsed, closeSidebar }) => (
        <Link 
          href="/" 
          onClick={() => {
            closeSidebar();
            router.push('/');
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <Image 
            src="/icon.svg" 
            alt="JulaZone" 
            width={40} 
            height={40} 
            className="rounded-lg flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-base font-bold text-gray-900">JulaZone</span>
              <span className="text-xs text-gray-500">Shop & Discover</span>
            </div>
          )}
        </Link>
      )}
      footer={({ collapsed }) =>
        !collapsed ? (
          <div className="px-3 py-2">
            {authChecked && isAuthenticated && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 mb-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Sign Out</span>
              </button>
            )}
            <p className="text-xs text-muted-foreground">© 2026 JulaZone. All rights reserved.</p>
          </div>
        ) : null
      }
    />
  );
}
