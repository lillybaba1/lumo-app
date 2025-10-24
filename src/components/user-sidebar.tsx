
import Link from 'next/link';
import CategoryLink from '@/components/category-link';
import { Home, ShoppingCart, User, Tag, Compass, UserCog } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { getCategories, getProducts } from '@/services/productService';
import SidebarCategories from './sidebar-categories';
import { getCurrentUser } from '@/hooks/use-auth';
import type { Category } from '@/lib/types';

export default async function UserSidebar() {
  let categories: Category[] = [];
  let user = null;
  
    try {
        const [cats, userData, products] = await Promise.all([
            getCategories(),
            getCurrentUser(),
            getProducts(),
        ]);
        categories = cats;
        user = userData;

        // compute simple counts per category (by category id or name)
        const counts: Record<string, number> = {};
        products.forEach(p => {
            const cid = p.categoryId ?? (typeof p.category === 'string' ? p.category.toLowerCase().replace(/\s+/g, '-') : undefined);
            if (cid) counts[cid] = (counts[cid] || 0) + 1;
        });
        // attach counts to categories via a small object passed to client component
        (categories as any).__counts = counts;
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

                                 {/* Categories */}
                                 <SidebarGroup>
                                        <SidebarGroupLabel>Categories</SidebarGroupLabel>
                                        <div className="px-3">
                                            {/* Client component for interactive category list */}
                                            <SidebarCategories categories={categories} counts={(categories as any).__counts} />
                                        </div>
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
