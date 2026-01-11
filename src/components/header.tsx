"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Shield, User, Home, Search, Store, ChevronDown, LogOut, Package, Settings, Camera as CameraIcon } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import MobileSearchModal from "./mobile-search-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface UserData {
  uid: string;
  email: string;
  role: string;
  name: string;
  hasBusinessAccount?: boolean;
  businessStatus?: string;
}

interface HeaderSettings {
  headerBgColor?: string;
  headerTextColor?: string;
  headerButtonStyle?: 'outline' | 'solid' | 'ghost';
  headerButtonColor?: string;
  homeButtonGradientFrom?: string;
  homeButtonGradientTo?: string;
  logoUrl?: string;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  storeName?: string;
}

// Local defaults for instant loading - matches JulaZone branding
// These are used immediately, admin settings override after fetch
const defaultHeaderSettings: HeaderSettings = {
  headerBgColor: 'rgba(255, 255, 255, 0.9)', // White with slight transparency
  headerTextColor: '#0f172a', // Dark slate (almost black)
  headerButtonStyle: 'outline',
  headerButtonColor: '#0f172a',
  homeButtonGradientFrom: '#4F46E5',
  homeButtonGradientTo: '#14B8A6',
  logoUrl: '',
  logoAlt: 'JulaZone',
  logoWidth: 40,
  logoHeight: 40,
  storeName: 'JulaZone',
};

export default function Header() {
  const { state } = useCart();
  const pathname = usePathname();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Hide header on dashboard pages (they have their own layouts)
  if (pathname?.startsWith('/business') || pathname?.startsWith('/admin')) {
    return null;
  }
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [settings, setSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    // Fetch current user info from API
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
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
        setAuthChecked(true);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
    };

    // Fetch header settings
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          setSettings({
            headerBgColor: data.headerBgColor || defaultHeaderSettings.headerBgColor,
            headerTextColor: data.headerTextColor || defaultHeaderSettings.headerTextColor,
            headerButtonStyle: data.headerButtonStyle || defaultHeaderSettings.headerButtonStyle,
            headerButtonColor: data.headerButtonColor || defaultHeaderSettings.headerButtonColor,
            homeButtonGradientFrom: data.homeButtonGradientFrom || defaultHeaderSettings.homeButtonGradientFrom,
            homeButtonGradientTo: data.homeButtonGradientTo || defaultHeaderSettings.homeButtonGradientTo,
            logoUrl: data.logoUrl || defaultHeaderSettings.logoUrl,
            logoAlt: data.logoAlt || defaultHeaderSettings.logoAlt,
            logoWidth: data.logoWidth || defaultHeaderSettings.logoWidth,
            logoHeight: data.logoHeight || defaultHeaderSettings.logoHeight,
            storeName: data.storeName || defaultHeaderSettings.storeName,
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };

    fetchUserData();
    fetchSettings();
  }, [pathname]);

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-60"
        style={{ 
          backgroundColor: settings.headerBgColor,
          color: settings.headerTextColor,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Mobile Header - Logo + Search Bar + Menu */}
        <div className="flex md:hidden w-full h-14 items-center px-3 gap-2">
          {/* Logo - Removed to make space for full search bar */}
          
          {/* Search Bar - Main Focus */}
          <div className="flex-1">
            <button
              onClick={() => setMobileSearchOpen(true)}
              className="w-full h-10 px-4 flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200/60"
            >
              <div className="flex items-center gap-2 text-gray-500">
                <Search className="h-4 w-4" />
                <span className="text-sm font-medium">Search or ask a question</span>
              </div>
              <CameraIcon className="h-5 w-5 text-gray-400" />
            </button>
          </div>
          
          {/* Menu Button (3 lines) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 h-9 w-9 hover:bg-white/10"
                style={{ color: settings.headerTextColor }}
                aria-label="Open menu"
              >
                {/* 3-line menu icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
                  <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
                  <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {isAuthenticated && user ? (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {user?.hasBusinessAccount && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={user.businessStatus === 'ACTIVE' ? '/business/dashboard' : '/business/pending'} className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/logout" className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem asChild>
                    <Link href="/login" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Sign In
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/signup" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Create Account
                    </Link>
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/categories" className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  All Categories
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex w-full h-14 items-center px-4 md:px-6 gap-3">
          {/* Logo & Store Name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="relative h-9 w-9 flex items-center">
              <Image
                src="/icon.svg"
                alt={settings.logoAlt || settings.storeName || 'Site Logo'}
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: settings.headerTextColor }}>
              {settings.storeName}
            </span>
          </Link>
          
          {/* Search Bar - Full Width Center */}
          <div className="flex flex-1 max-w-2xl mx-4">
            <SearchBar variant="header" placeholder="Search products, brands, and more..." className="w-full" />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {/* User Account Dropdown */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="flex items-center gap-1 px-2 h-9 hover:bg-white/10"
                    style={{ color: settings.headerTextColor }}
                  >
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium max-w-[100px] truncate">{user.name?.split(' ')[0]}</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link href="/account/profile" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/orders" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      My Orders
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/wishlist" className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Wishlist
                    </Link>
                  </DropdownMenuItem>
                  {user?.hasBusinessAccount && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={user.businessStatus === 'ACTIVE' ? '/business/dashboard' : '/business/pending'} className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/api/auth/logout" className="flex items-center gap-2 text-red-600">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                asChild 
                className="hidden md:flex h-9 px-3 hover:bg-white/10"
                style={{ color: settings.headerTextColor }}
              >
                <Link href="/login">
                  <User className="h-4 w-4 mr-1.5" />
                  Sign In
                </Link>
              </Button>
            )}

            {/* Cart Button - Desktop Only (Mobile uses bottom nav) */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="hidden md:flex relative h-9 w-9 hover:bg-white/10" 
              asChild 
              style={{ color: settings.headerTextColor }}
            >
              <Link href="/cart">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full p-0 text-[10px] font-bold"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </Badge>
                )}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div className="h-14 w-full flex-shrink-0" />

      {/* Mobile Search Modal */}
      <MobileSearchModal 
        isOpen={mobileSearchOpen} 
        onClose={() => setMobileSearchOpen(false)} 
      />
    </>
  );
}
