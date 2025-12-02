"use client";

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  LogOut,
  Settings,
  Truck,
  CreditCard,
  BarChart,
  Store,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  User,
  Crown,
  Shield,
  Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { BusinessAccount } from '@/lib/types';

type BusinessUser = {
  userId: string;
  email: string;
  name: string;
  role: string;
};

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/business/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/business/boutique', icon: Store, label: 'My Boutique' },
      { href: '/business/analytics', icon: BarChart, label: 'Analytics' },
    ]
  },
  {
    label: 'Catalog',
    items: [
      { href: '/business/products', icon: Package, label: 'My Products' },
      { href: '/business/products/add', icon: Package, label: 'Add Product' },
    ]
  },
  {
    label: 'Sales',
    items: [
      { href: '/business/orders', icon: ShoppingCart, label: 'Orders' },
      { href: '/business/earnings', icon: Wallet, label: 'Earnings' },
    ]
  },
  {
    label: 'Account',
    items: [
      { href: '/business/subscription', icon: Crown, label: 'Subscription' },
      { href: '/business/verification', icon: Shield, label: 'Verification' },
      { href: '/business/profile', icon: User, label: 'Business Profile' },
      { href: '/business/shipping', icon: Truck, label: 'Shipping Settings' },
      { href: '/business/payout', icon: CreditCard, label: 'Payout Settings' },
      { href: '/business/settings', icon: Settings, label: 'Account Settings' },
    ]
  }
];

type BusinessSidebarProps = {
  user: BusinessUser;
  businessAccount: BusinessAccount;
}

export default function BusinessSidebar({ user, businessAccount }: BusinessSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleLogoClick = () => {
    setMobileOpen(false);
    router.push('/');
  };

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (res.ok) {
      toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
      });
      window.location.assign('/login');
    } else {
      toast({
        title: "Logout Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    }
  }

  const SidebarContent = () => (
    <>
      {/* Header - Clickable to go home */}
      <Link 
        href="/"
        onClick={handleLogoClick}
        className={cn(
          "flex items-center gap-3 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-accent/5 cursor-pointer hover:opacity-80 transition-opacity",
          collapsed && "px-3 justify-center"
        )}
      >
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
          <Store className="h-6 w-6" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <h1 className="text-xl font-headline font-bold truncate max-w-[180px]">
              {businessAccount.businessName}
            </h1>
            <span className="text-xs text-muted-foreground">Seller Dashboard</span>
          </div>
        )}
      </Link>

      {/* Status Badge */}
      {!collapsed && (
        <div className="px-6 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "h-2 w-2 rounded-full",
              businessAccount.status === 'ACTIVE' && "bg-green-500",
              businessAccount.status === 'PENDING_VERIFICATION' && "bg-yellow-500",
              businessAccount.status === 'PENDING_APPROVAL' && "bg-orange-500",
              businessAccount.status === 'SUSPENDED' && "bg-red-500"
            )} />
            <span className="text-xs font-medium">
              {businessAccount.status === 'ACTIVE' && 'Active'}
              {businessAccount.status === 'PENDING_VERIFICATION' && 'Pending Verification'}
              {businessAccount.status === 'PENDING_APPROVAL' && 'Pending Approval'}
              {businessAccount.status === 'SUSPENDED' && 'Suspended'}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-grow px-3 py-6 overflow-y-auto">
        <div className="space-y-6">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </h3>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          "hover:bg-accent/50 hover:text-accent-foreground",
                          isActive && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                          !isActive && "text-muted-foreground",
                          collapsed && "justify-center"
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "drop-shadow")} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="border-t bg-muted/30">
        {!collapsed && (
          <div className="px-4 py-3 border-b">
            <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground">Business Account</p>
          </div>
        )}
        <div className="p-3">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive",
              collapsed && "justify-center px-2"
            )}
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3 bg-card border-b shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
            <Store className="h-5 w-5" />
          </div>
          <h1 className="text-lg font-headline font-bold truncate max-w-[200px]">
            {businessAccount.businessName}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-card border-r shadow-xl transition-transform duration-300 ease-in-out flex flex-col",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 border-r bg-card text-card-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-[4.5rem]" : "w-72",
          "min-h-screen sticky top-0 h-screen"
        )}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-10 h-6 w-6 rounded-full border bg-background shadow-md hover:shadow-lg transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <SidebarContent />
      </aside>
    </>
  );
}
