"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingCart, User, Tag, Compass } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { categories } from '@/lib/mock-data';

export default function UserSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" side="left">
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

                 <SidebarGroup>
                    <SidebarGroupLabel>Categories</SidebarGroupLabel>
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
                 </SidebarGroup>

                 <SidebarGroup>
                    <SidebarGroupLabel>My Account</SidebarGroupLabel>
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
                 </SidebarGroup>

            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  );
}
