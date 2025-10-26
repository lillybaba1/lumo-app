
"use client";

import Link from "next/link";
import { ShoppingBag, Heart, Shield } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { SidebarTrigger } from "./ui/sidebar";
import { useEffect, useState } from "react";

export default function Header({ children }: { children: React.ReactNode }) {
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Fetch current user info from API to check admin status
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          credentials: 'same-origin',
        });

        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user?.role === 'admin') {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2" />
          <Link href="/" className="flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Lumo</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            {children}
            {isAdmin && (
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">
                  <Shield className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Admin</span>
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link href="/wishlist">
                <Heart className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Wishlist</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="relative">
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
  );
}
