"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, LogOut, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card text-card-foreground flex flex-col">
      <div className="p-4 border-b">
        <Link href="/admin/dashboard" className="flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-headline font-bold">Lumo</h1>
        </Link>
      </div>
      <nav className="flex-grow px-4 py-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.label}>
              <Button
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
                asChild
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t">
         <div className="flex items-center gap-3 mb-4">
            <Avatar>
                <AvatarImage src="https://placehold.co/40x40" alt="Admin" />
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
                <p className="font-semibold">Sillah</p>
                <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
         </div>
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href="/login">
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </Button>
      </div>
    </aside>
  );
}
