
import Link from 'next/link';
import { Home, ShoppingCart, Compass, UserCog } from 'lucide-react';
import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { getCurrentUser } from '@/hooks/use-auth';

export default async function UserSidebar() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error('Error loading user data:', error);
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
