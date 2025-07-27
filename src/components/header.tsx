"use client";

import Link from "next/link";
import { ShoppingBag, User, Menu } from "lucide-react";
import { Button } from "./ui/button";
import { useCart } from "@/hooks/use-cart";
import { Badge } from "./ui/badge";
import { SidebarTrigger } from "./ui/sidebar";

export default function Header() {
  const { state } = useCart();
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex items-center">
           <SidebarTrigger className="md:hidden mr-2" />
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <ShoppingBag className="h-6 w-6 text-primary" />
            <span className="font-bold font-headline text-lg">Lumo</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Button variant="ghost" asChild>
                <Link href="/admin/dashboard">
                    <User className="h-4 w-4 mr-2" />
                    Admin
                </Link>
            </Button>
            <Button variant="outline" asChild className="relative">
              <Link href="/cart">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Cart
                {itemCount > 0 && (
                  <Badge variant="destructive" className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full p-1">
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
