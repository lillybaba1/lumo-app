"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Tag, Compass } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { categories } from '@/lib/mock-data';

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Home">
                        <Link href="/">
                            <Home />
                            <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/products')} tooltip="All Products">
                        <Link href="#">
                            <Compass />
                            <span>All Products</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                 <SidebarHeader>
                    <h2 className="text-base font-semibold px-2">Categories</h2>
                </SidebarHeader>
                 {categories.map((category) => (
                    <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton asChild tooltip={category.name}>
                             <Link href="#">
                                <Tag />
                                <span>{category.name}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}

                 <SidebarHeader>
                    <h2 className="text-base font-semibold px-2">My Account</h2>
                </SidebarHeader>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/cart'} tooltip="Cart">
                        <Link href="/cart">
                            <ShoppingCart />
                            <span>Cart</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith('/admin')} tooltip="Admin">
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
