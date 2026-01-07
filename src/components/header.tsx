
"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Shield, User, Home, CheckSquare, Search, Store } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import MobileSearchModal from "./mobile-search-modal";

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
  headerBgColor: '#d946ef', // Magenta/fuchsia - JulaZone brand color
  headerTextColor: '#ffffff',
  headerButtonStyle: 'outline',
  headerButtonColor: '#ffffff',
  homeButtonGradientFrom: '#4F46E5',
  homeButtonGradientTo: '#14B8A6',
  logoUrl: '',
  logoAlt: 'JulaZone',
  logoWidth: 40,
  logoHeight: 40,
  storeName: 'JulaZone',
};

export default function Header({ children }: { children: React.ReactNode }) {
  const { state } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [settings, setSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  
  // Check if we're on the homepage
  const isHomePage = pathname === '/';

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

  const buttonStyle = settings.headerButtonStyle === 'solid' 
    ? { backgroundColor: settings.headerButtonColor, color: '#fff', borderColor: 'transparent' }
    : settings.headerButtonStyle === 'ghost'
    ? { backgroundColor: 'transparent', color: settings.headerTextColor, borderColor: 'transparent' }
    : { backgroundColor: 'transparent', color: settings.headerTextColor, borderColor: settings.headerButtonColor };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-60 pt-[env(safe-area-inset-top,0px)]"
        style={{ 
          backgroundColor: settings.headerBgColor,
          color: settings.headerTextColor,
          paddingTop: 'max(env(safe-area-inset-top, 0px), 24px)', // Safe area for notched devices + extra padding for status bar
        }}
      >
        <div className="w-full flex h-14 items-center px-2 sm:px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2 md:gap-3 group">
              {/* Logo - Always use local /icon.svg for instant loading */}
              <div className="relative h-10 flex items-center">
                <Image
                  src="/icon.svg"
                  alt={settings.logoAlt || settings.storeName || 'Site Logo'}
                  width={40}
                  height={40}
                  className="object-contain h-10 w-auto"
                  priority
                />
              </div>
            </Link>
            {!isHomePage && (
              <Link 
                href="/"
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-md text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ 
                  background: `linear-gradient(to right, ${settings.homeButtonGradientFrom}, ${settings.homeButtonGradientTo})` 
                }}
              >
                <Home className="h-4 w-4" strokeWidth={2.5} />
                <span className="hidden sm:inline">Home</span>
              </Link>
            )}
          </div>
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <SearchBar variant="header" placeholder="Search products..." className="max-w-md" />
          </div>

          <div className="flex items-center justify-end space-x-2">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {children}
              {isAuthenticated && user && (
                <Button variant="outline" asChild style={buttonStyle}>
                  <Link href="/account/profile">
                    <User className="h-4 w-4 mr-2" />
                    <span>{user.name}</span>
                  </Link>
                </Button>
              )}
              {user?.role === 'admin' && (
                <Button variant="outline" asChild style={buttonStyle}>
                  <Link href="/admin/dashboard">
                    <Shield className="h-4 w-4 mr-2" />
                    <span>Admin</span>
                  </Link>
                </Button>
              )}
              {user?.hasBusinessAccount && (
                <Button variant="outline" asChild style={buttonStyle}>
                  <Link href={user.businessStatus === 'ACTIVE' ? '/business/dashboard' : '/business/pending'}>
                    <Store className="h-4 w-4 mr-2" />
                    <span>Seller</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild style={buttonStyle}>
                <Link href="/wishlist">
                  <Heart className="h-4 w-4 mr-2" />
                  <span>Wishlist</span>
                </Link>
              </Button>
              <Button variant="outline" className="relative" asChild style={buttonStyle}>
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  <span>Cart</span>
                  {itemCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-1 text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </nav>

            {/* Mobile Navigation */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Search Button - Mobile */}
              <Button 
                variant="outline" 
                size="icon" 
                className="h-9 w-9" 
                style={buttonStyle}
                onClick={() => setMobileSearchOpen(true)}
              >
                <Search className="h-4 w-4" />
              </Button>
              {/* Cart Button - Always visible on mobile */}
              <Button variant="outline" size="icon" className="h-9 w-9 relative" asChild style={buttonStyle}>
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4" />
                  {itemCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]">
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Modal */}
      <MobileSearchModal 
        isOpen={mobileSearchOpen} 
        onClose={() => setMobileSearchOpen(false)} 
      />
    </>
  );
}
