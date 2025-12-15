
import Link from 'next/link';
import {
  Home,
  ShoppingCart,
  Compass,
  UserCog,
  Heart,
  Package,
  User,
  Settings,
  Bell,
  CreditCard,
  MapPin,
  HelpCircle,
  Tag,
  Sparkles,
  TrendingUp,
  LogOut,
  Mail
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter
} from '@/components/ui/sidebar';
import { getCurrentUser } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from '@/components/sign-out-button';

export default async function UserSidebar() {
  let user = null;

  try {
    user = await getCurrentUser();
  } catch (error) {
    console.error('Error loading user data:', error);
    // Continue with empty data rather than crashing
  }

  return (
    <Sidebar collapsible="icon" side="left" className="border-r bg-white/90 backdrop-blur">
        <SidebarHeader className="border-b">
          <div className="px-4 py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold font-headline">JulaZone</span>
                <span className="text-xs text-muted-foreground">Shop & Discover</span>
              </div>
            </Link>
          </div>
        </SidebarHeader>

        <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Browse</SidebarGroupLabel>
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
                        <Link href="/products">
                            <Compass />
                            <span>All Products</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="New Arrivals">
                        <Link href="/products?filter=new">
                            <Sparkles />
                            <span>New Arrivals</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Best Sellers">
                        <Link href="/products?filter=bestsellers">
                            <TrendingUp />
                            <span>Best Sellers</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Deals & Offers">
                        <Link href="/products?filter=deals">
                            <Tag />
                            <span>Deals & Offers</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup>
               <SidebarGroupLabel>My Account</SidebarGroupLabel>
               <SidebarMenu>
                 {user ? (
                   <>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Profile">
                            <Link href="/account/profile">
                                <User />
                                <span>My Profile</span>
                            </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Orders">
                            <Link href="/orders">
                                <Package />
                                <span>My Orders</span>
                            </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Wishlist">
                            <Link href="/wishlist">
                                <Heart />
                                <span>Wishlist</span>
                            </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton asChild tooltip="Cart">
                           <Link href="/cart">
                               <ShoppingCart />
                               <span>Shopping Cart</span>
                           </Link>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                   </>
                 ) : (
                   <>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Wishlist">
                            <Link href="/wishlist">
                                <Heart />
                                <span>Wishlist</span>
                            </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                       <SidebarMenuButton asChild tooltip="Cart">
                           <Link href="/cart">
                               <ShoppingCart />
                               <span>Shopping Cart</span>
                           </Link>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                     <SidebarMenuItem>
                        <SidebarMenuButton asChild tooltip="Sign In">
                            <Link href="/login">
                                <User />
                                <span>Sign In</span>
                            </Link>
                        </SidebarMenuButton>
                     </SidebarMenuItem>
                   </>
                 )}
               </SidebarMenu>
            </SidebarGroup>

            {user && (
              <SidebarGroup>
                <SidebarGroupLabel>Settings</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Payment Methods">
                          <Link href="/account/payment-methods">
                              <CreditCard />
                              <span>Payment Methods</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Addresses">
                          <Link href="/account/addresses">
                              <MapPin />
                              <span>Addresses</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Notifications">
                          <Link href="/account/notifications">
                              <Bell />
                              <span>Notifications</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Account Settings">
                          <Link href="/account/settings">
                              <Settings />
                              <span>Account Settings</span>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Support</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Help Center">
                        <Link href="/pages/faq">
                            <HelpCircle />
                            <span>Help Center</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip="Contact Us">
                        <Link href="/pages/contact">
                            <HelpCircle />
                            <span>Contact Us</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {user?.role === 'admin' && (
              <SidebarGroup>
                <SidebarGroupLabel>Administration</SidebarGroupLabel>
                <SidebarMenu>
                  <SidebarMenuItem>
                      <SidebarMenuButton asChild tooltip="Admin Dashboard">
                          <Link href="/admin/dashboard">
                              <UserCog />
                              <span>Admin Dashboard</span>
                              <Badge variant="secondary" className="ml-auto">Admin</Badge>
                          </Link>
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroup>
            )}

        </SidebarContent>

        <SidebarFooter className="border-t mt-auto">
          {user ? (
            <div className="p-2 space-y-2">
              {/* User info */}
              <div className="flex items-center gap-3 px-2 py-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium truncate">{user.displayName || 'User'}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                </div>
              </div>
              {/* Sign out button */}
              <SignOutButton 
                variant="ghost" 
                className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-2" />
                <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
              </SignOutButton>
            </div>
          ) : (
            <div className="p-2">
              <Link 
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <User className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">Sign In</span>
              </Link>
            </div>
          )}
          <div className="px-3 py-2 text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
            <p>© 2025 JulaZone. All rights reserved.</p>
          </div>
        </SidebarFooter>
    </Sidebar>
  );
}
