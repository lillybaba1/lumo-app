"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Brush, Users, BarChart, Settings, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { href: '/admin/products', icon: Package, label: 'Products' },
  { href: '/admin/appearance', icon: Brush, label: 'Appearance' },
  { href: '/admin/pages', icon: FileText, label: 'Pages' },
  { href: '#', icon: Users, label: 'Customers' },
  { href: '#', icon: BarChart, label: 'Analytics' },
  { href: '#', icon: Settings, label: 'Settings' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card text-card-foreground flex flex-col">
      <div className="p-4 border-b flex items-center gap-2">
         <h1 className="text-2xl font-headline font-bold">Lumo</h1>
      </div>
      <nav className="flex-grow px-2 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <Button
                variant={pathname.startsWith(item.href) && item.href !== '#' ? 'secondary' : 'ghost'}
                className="w-full justify-start gap-2"
                asChild
                disabled={item.href === '#'}
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
      <div className="p-4 border-t mt-auto">
        <Button variant="outline" className="w-full justify-start gap-2" asChild>
          <Link href="/">
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </Button>
      </div>
    </aside>
  );
}
