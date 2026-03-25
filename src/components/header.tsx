"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Shield, User, Home, Store, ChevronDown, LogOut, Package } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";
import SearchBar from "./search-bar";
import { useSettings } from "@/context/settings-context";
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

export default function Header() {
  const { state } = useCart();
  const pathname = usePathname();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const { settings: globalSettings, auth } = useSettings();
  
  const user: UserData | null = auth.user || null;
  const isAuthenticated = auth.isAuthenticated;
  const storeName = (globalSettings?.storeName as string) || 'JulaZone';

  // Hide header on dashboard pages (they have their own layouts)
  const isHidden = pathname?.startsWith('/business') || pathname?.startsWith('/admin');

  if (isHidden) return null;

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-50 w-full bg-white"
        style={{ 
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        {/* Mobile Header - Clean: Menu | Logo + Store Name | Cart */}
        <div className="flex md:hidden w-full h-14 items-center px-3 gap-2 bg-white" style={{ color: '#1e293b' }}>
          {/* Left: Menu Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 h-9 w-9 text-slate-800"
                aria-label="Open menu"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="4" y="6" width="16" height="2" rx="1" fill="currentColor" />
                  <rect x="4" y="11" width="16" height="2" rx="1" fill="currentColor" />
                  <rect x="4" y="16" width="16" height="2" rx="1" fill="currentColor" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {isAuthenticated && user ? (
                <>
                  {/* Admin Dashboard - Show first for admins */}
                  {user?.role === 'admin' && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/dashboard" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {/* Seller Dashboard - Show second for business accounts or users with business role */}
                  {(user?.hasBusinessAccount || user?.role === 'business' || user?.role === 'BUSINESS_ACCOUNT') && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link href={user.businessStatus === 'ACTIVE' ? '/business/dashboard' : '/business/pending'} className="flex items-center gap-2">
                          <Store className="h-4 w-4" />
                          Seller Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600 cursor-pointer" onClick={async () => {
                     try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login';
                     } catch (e) {
                        console.error('Sign out error:', e);
                     }
                  }}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
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

          {/* Center: Logo + Store Name */}
          <Link href="/" className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative h-8 w-8 flex-shrink-0 flex items-center">
              <Image
                src="/icon.svg"
                alt={storeName}
                width={32}
                height={32}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold text-slate-900 truncate">
              {storeName}
            </span>
          </Link>

          {/* Right: Cart icon (search is in bottom nav) */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex-shrink-0 relative h-9 w-9 text-slate-800" 
            asChild
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

        {/* Desktop Header */}
        <div className="hidden md:flex w-full h-14 items-center px-4 md:px-6 gap-3 bg-white text-slate-900">
          {/* Logo & Store Name */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
            <div className="relative h-9 w-9 flex items-center">
              <Image
                src="/icon.svg"
                alt={storeName}
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              {storeName}
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
                    className="flex items-center gap-1 px-2 h-9 text-slate-800 hover:bg-slate-100"
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
                  <DropdownMenuItem className="flex items-center gap-2 text-red-600 cursor-pointer" onClick={async () => {
                     // Client-side logout logic
                     try {
                        await fetch('/api/auth/logout', { method: 'POST' });
                        window.location.href = '/login'; // Force reload to clear state
                     } catch (e) {
                        console.error('Sign out error:', e);
                     }
                  }}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                variant="ghost" 
                asChild 
                className="hidden md:flex h-9 px-3 text-slate-800 hover:bg-slate-100"
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
              className="hidden md:flex relative h-9 w-9 text-slate-800 hover:bg-slate-100" 
              asChild
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

      {/* Spacer to prevent content from being hidden behind fixed header - accounts for safe area on mobile */}
      <div 
        className="w-full flex-shrink-0" 
        style={{ height: 'calc(3.5rem + env(safe-area-inset-top, 0px))' }}
      />


    </>
  );
}
