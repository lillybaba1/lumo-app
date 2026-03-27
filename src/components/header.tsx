"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag, Heart, Shield, User, Home, Store, ChevronDown, LogOut, Package, Grid, Star, Tag, HelpCircle, Mail, Menu, ShoppingCart, X } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { usePathname } from "next/navigation";
import SearchBar from "./search-bar";
import { useSettings } from "@/context/settings-context";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
          paddingTop: 'var(--capacitor-status-bar-height, env(safe-area-inset-top, 0px))',
          transform: 'translateY(var(--keyboard-offset, 0px))',
        }}
      >
        {/* Mobile Header - Clean: Menu | Logo + Store Name | Cart */}
        <div className="flex md:hidden w-full h-14 items-center px-3 gap-2 bg-white" style={{ color: '#1e293b' }}>
          {/* Left: Menu Button — opens slide-out navigation */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="flex-shrink-0 h-9 w-9 text-slate-800"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px]">
              <div className="flex flex-col h-full bg-white">
                {/* Drawer Header */}
                <div 
                  className="flex items-center gap-3 px-4 py-3 border-b"
                  style={{ paddingTop: 'calc(0.75rem + var(--capacitor-status-bar-height, env(safe-area-inset-top, 0px)))' }}
                >
                  <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3">
                    <Image src="/icon.svg" alt={storeName} width={40} height={40} className="rounded-lg" />
                    <div className="flex flex-col">
                      <span className="text-base font-bold text-gray-900">{storeName}</span>
                      <span className="text-xs text-gray-500">Shop & Discover</span>
                    </div>
                  </Link>
                </div>

                {/* Navigation Sections */}
                <nav className="flex-grow px-3 py-4 overflow-y-auto">
                  {/* Browse Section */}
                  <div className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Browse</h3>
                    <ul className="space-y-1">
                      {[
                        { href: '/', label: 'Home', icon: Home },
                        { href: '/products', label: 'All Products', icon: Grid },
                        { href: '/products?filter=new', label: 'New Arrivals', icon: ShoppingBag },
                        { href: '/products?filter=bestsellers', label: 'Best Sellers', icon: Star },
                        { href: '/products?filter=deals', label: 'Deals & Offers', icon: Tag },
                        { href: '/categories', label: 'All Categories', icon: Grid },
                      ].map((item) => (
                        <li key={item.label}>
                          <Link
                            href={item.href}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                              pathname === item.href
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            <span>{item.label}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* My Account Section */}
                  <div className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">My Account</h3>
                    <ul className="space-y-1">
                      {isAuthenticated && user ? (
                        <>
                          {user?.role === 'admin' && (
                            <li>
                              <Link href="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <Shield className="h-5 w-5" />
                                <span>Admin Dashboard</span>
                              </Link>
                            </li>
                          )}
                          {(user?.hasBusinessAccount || user?.role === 'business' || user?.role === 'BUSINESS_ACCOUNT') && (
                            <li>
                              <Link href={user.businessStatus === 'ACTIVE' ? '/business/dashboard' : '/business/pending'} onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                                <Store className="h-5 w-5" />
                                <span>Seller Dashboard</span>
                              </Link>
                            </li>
                          )}
                          <li>
                            <Link href="/account/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <User className="h-5 w-5" />
                              <span>My Profile</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <Package className="h-5 w-5" />
                              <span>My Orders</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <Heart className="h-5 w-5" />
                              <span>Wishlist</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <ShoppingCart className="h-5 w-5" />
                              <span>Shopping Cart</span>
                            </Link>
                          </li>
                        </>
                      ) : (
                        <>
                          <li>
                            <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <Heart className="h-5 w-5" />
                              <span>Wishlist</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <ShoppingCart className="h-5 w-5" />
                              <span>Shopping Cart</span>
                            </Link>
                          </li>
                          <li>
                            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                              <User className="h-5 w-5" />
                              <span>Sign In</span>
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>

                  {/* Support Section */}
                  <div className="mb-6">
                    <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Support</h3>
                    <ul className="space-y-1">
                      <li>
                        <Link href="/pages/faq" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                          <HelpCircle className="h-5 w-5" />
                          <span>Help Center</span>
                        </Link>
                      </li>
                      <li>
                        <Link href="/pages/contact" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100">
                          <Mail className="h-5 w-5" />
                          <span>Contact Us</span>
                        </Link>
                      </li>
                    </ul>
                  </div>
                </nav>

                {/* Footer */}
                <div className="border-t px-3 py-2">
                  {isAuthenticated && user && (
                    <button
                      onClick={async () => {
                        setMobileMenuOpen(false);
                        try {
                          await fetch('/api/auth/logout', { method: 'POST' });
                          window.location.href = '/login';
                        } catch (e) {
                          console.error('Sign out error:', e);
                        }
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 mb-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  )}
                  <p className="text-xs text-gray-400 px-3 pb-1">© 2026 JulaZone. All rights reserved.</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

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

      {/* Spacer to prevent content from being hidden behind fixed header */}
      <div 
        className="w-full flex-shrink-0"
        style={{ height: 'calc(3.5rem + var(--capacitor-status-bar-height, env(safe-area-inset-top, 0px)))' }}
      />


    </>
  );
}
