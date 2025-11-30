
"use client";

import Link from "next/link";
import { ShoppingBag, Heart, Shield, User, Home, CheckSquare, X } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface UserData {
  uid: string;
  email: string;
  role: string;
  name: string;
}

interface HeaderSettings {
  headerBgColor?: string;
  headerTextColor?: string;
  headerButtonStyle?: 'outline' | 'solid' | 'ghost';
  headerButtonColor?: string;
  homeButtonGradientFrom?: string;
  homeButtonGradientTo?: string;
  announcementEnabled?: boolean;
  announcementText?: string;
  announcementBgColor?: string;
  announcementTextColor?: string;
  announcementLink?: string;
}

const defaultHeaderSettings: HeaderSettings = {
  headerBgColor: '#ffffff',
  headerTextColor: '#000000',
  headerButtonStyle: 'outline',
  headerButtonColor: '#8b5cf6',
  homeButtonGradientFrom: '#8b5cf6',
  homeButtonGradientTo: '#ec4899',
  announcementEnabled: false,
  announcementText: '',
  announcementBgColor: '#8b5cf6',
  announcementTextColor: '#ffffff',
  announcementLink: '',
};

export default function Header({ children }: { children: React.ReactNode }) {
  const { state } = useCart();
  const pathname = usePathname();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [settings, setSettings] = useState<HeaderSettings>(defaultHeaderSettings);
  const [announcementDismissed, setAnnouncementDismissed] = useState(false);
  
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
      } catch (error) {
        console.error('Error fetching user data:', error);
        setUser(null);
        setIsAuthenticated(false);
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
            announcementEnabled: data.announcementEnabled ?? defaultHeaderSettings.announcementEnabled,
            announcementText: data.announcementText || defaultHeaderSettings.announcementText,
            announcementBgColor: data.announcementBgColor || defaultHeaderSettings.announcementBgColor,
            announcementTextColor: data.announcementTextColor || defaultHeaderSettings.announcementTextColor,
            announcementLink: data.announcementLink || defaultHeaderSettings.announcementLink,
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

  const AnnouncementContent = () => (
    <span className="font-medium">{settings.announcementText}</span>
  );

  return (
    <>
      {/* Announcement Bar */}
      {settings.announcementEnabled && settings.announcementText && !announcementDismissed && (
        <div 
          className="relative py-2 px-4 text-center text-sm"
          style={{ 
            backgroundColor: settings.announcementBgColor,
            color: settings.announcementTextColor,
          }}
        >
          {settings.announcementLink ? (
            <Link href={settings.announcementLink} className="hover:underline">
              <AnnouncementContent />
            </Link>
          ) : (
            <AnnouncementContent />
          )}
          <button 
            onClick={() => setAnnouncementDismissed(true)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-white/20 transition-colors"
            aria-label="Dismiss announcement"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <header 
        className="sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-opacity-60"
        style={{ 
          backgroundColor: settings.headerBgColor,
          color: settings.headerTextColor,
        }}
      >
        <div className="container flex h-16 items-center">
          <Link href="/" className="flex items-center gap-3 group">
            {/* Enhanced Logo */}
            <div 
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-white shadow-md group-hover:shadow-lg transition-shadow"
              style={{ backgroundColor: settings.headerButtonColor }}
            >
              <CheckSquare className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="font-bold font-headline text-xl leading-tight tracking-tight">Lumo</span>
            {!isHomePage && (
              <button 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
                style={{ 
                  background: `linear-gradient(to right, ${settings.homeButtonGradientFrom}, ${settings.homeButtonGradientTo})` 
                }}
              >
                <Home className="h-4 w-4" strokeWidth={2.5} />
                <span>Home</span>
              </button>
            )}
          </Link>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <nav className="flex items-center space-x-2">
              {children}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-2">
                  <Button variant="outline" asChild style={buttonStyle}>
                    <Link href="/account/profile">
                      <User className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">{user.name}</span>
                    </Link>
                  </Button>
                </div>
              )}
              {user?.role === 'admin' && (
                <Button variant="outline" asChild style={buttonStyle}>
                  <Link href="/admin/dashboard">
                    <Shield className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Admin</span>
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild style={buttonStyle}>
                <Link href="/wishlist">
                  <Heart className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Wishlist</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="relative" style={buttonStyle}>
                <Link href="/cart">
                  <ShoppingBag className="h-4 w-4 md:mr-2" />
                   <span className="hidden md:inline">Cart</span>
                  {itemCount > 0 && (
                    <Badge variant="destructive" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-1 text-xs">
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
}
