"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Tag, Compass } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { categories } from '@/lib/mock-data';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/cart', icon: ShoppingCart, label: 'Cart' },
  { href: '/admin/dashboard', icon: User, label: 'Admin' },
];

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="hidden md:flex flex-col" collapsible="icon">
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/'}>
                        <Link href="/">
                            <Home />
                            <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/products')}>
                        <Link href="#">
                            <Compass />
                            <span>All Products</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                 <SidebarHeader>
                    <h2 className="text-lg font-semibold">Categories</h2>
                </SidebarHeader>
                 {categories.map((category) => (
                    <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton asChild>
                             <Link href="#">
                                <Tag />
                                <span>{category.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                 <SidebarHeader>
                    <h2 className="text-lg font-semibold">My Account</h2>
                </SidebarHeader>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/cart'}>
                        <Link href="/cart">
                            <ShoppingCart />
                            <span>Cart</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')}>
                        <Link href="/admin/dashboard">
                            <User />
                            <span>Admin</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  );
}
