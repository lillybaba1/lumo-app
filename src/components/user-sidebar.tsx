
import Link from 'next/link';
import CategoryLink from '@/components/category-link';
import { Home, ShoppingCart, User, Tag, Compass, UserCog } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { getCategories } from '@/services/productService';
import { getCurrentUser } from '@/hooks/use-auth';
import type { Category } from '@/lib/types';

export default async function UserSidebar() {
  let categories: Category[] = [];
  let user = null;
  
  try {
    [categories, user] = await Promise.all([
      getCategories(),
      getCurrentUser()
    ]);
  } catch (error) {
    console.error('Error loading sidebar data:', error);
    // Continue with empty data rather than crashing
  }

  return (
    <Sidebar collapsible="icon" side="left">
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Home">
                        <Link href="/">
                            <Home />
                            <span>Home</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="All Products">
                        <Link href="/">
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
                                 <CategoryLink href={`/categories/${category.id}`}>
                                    <Tag />
                                    <span>{category.name}</span>
                                </CategoryLink>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                 </SidebarGroup>

                 <SidebarGroup>
                    <SidebarGroupLabel>My Account</SidebarGroupLabel>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Cart">
                            <Link href="/cart">
                                <ShoppingCart />
                                <span>Cart</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    
                    {user?.role === 'admin' && (
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild tooltip="Admin">
                                <Link href="/admin/dashboard">
                                    <UserCog />
                                    <span>Admin</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    )}
                    
                 </SidebarGroup>

            </SidebarMenu>
        </SidebarContent>
    </Sidebar>
  );
}
