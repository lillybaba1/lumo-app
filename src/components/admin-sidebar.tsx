
"use client";

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { AppSidebar, SidebarSection } from '@/components/app-sidebar';
import { LayoutDashboard, Package, ShoppingCart, LogOut, Brush, Users, BarChart, Settings, FileText, Ticket, Star, CreditCard, FolderTree, Warehouse, Store, TrendingUp, HelpCircle, Mail, ImageIcon, Bot, PanelTop, Shield } from 'lucide-react';

type AdminUser = {
  userId: string;
  email: string;
  role: string;
};

const navGroups: SidebarSection[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/admin/analytics', icon: BarChart, label: 'Analytics' },
    ]
  },
  {
    label: 'Commerce',
    items: [
      { href: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
      { href: '/admin/products', icon: Package, label: 'Products' },
      { href: '/admin/inventory', icon: Warehouse, label: 'Inventory' },
      { href: '/admin/categories', icon: FolderTree, label: 'Categories' },
    ]
  },
  {
    label: 'Marketing',
    items: [
      { href: '/admin/coupons', icon: Ticket, label: 'Coupons' },
      { href: '/admin/reviews', icon: Star, label: 'Reviews' },
    ]
  },
  {
    label: 'Management',
    items: [
      { href: '/admin/customers', icon: Users, label: 'Customers' },
      { href: '/admin/payments', icon: CreditCard, label: 'Payments' },
      { href: '/admin/privacy', icon: Shield, label: 'Privacy & Consent' },
    ]
  },
  {
    label: 'Customization',
    items: [
      { href: '/admin/appearance', icon: Brush, label: 'Appearance' },
      { href: '/admin/header', icon: PanelTop, label: 'Header & Announcement' },
      { href: '/admin/hero', icon: ImageIcon, label: 'Hero Products' },
      { href: '/admin/collections', icon: TrendingUp, label: 'Collections' },
      { href: '/admin/pages', icon: FileText, label: 'Pages' },
      { href: '/admin/faq', icon: HelpCircle, label: 'FAQ' },
      { href: '/admin/contact', icon: Mail, label: 'Contact' },
      { href: '/admin/chatbot', icon: Bot, label: 'AI Chatbot' },
      { href: '/admin/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

type AdminSidebarProps = {
    user: AdminUser;
}

export default function AdminSidebar({ user }: AdminSidebarProps) {
  const { toast } = useToast();

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

  // Safety check
  if (!user) {
    return null;
  }

  return (
    <AppSidebar
      sections={navGroups}
      mobileTitle="Lumo Admin"
      mobileIcon={
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-bold">
          <Store className="h-5 w-5" />
        </div>
      }
      header={({ collapsed }) => (
        <>
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground font-bold text-lg">
            <Store className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <h1 className="text-xl font-headline font-bold">Lumo</h1>
              <span className="text-xs text-muted-foreground">Admin Dashboard</span>
            </div>
          )}
        </>
      )}
      footer={({ collapsed }) => (
        <>
          {!collapsed && (
            <div className="px-4 py-3 border-b">
              <p className="text-xs font-medium text-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
          )}
          <div className="p-3">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-destructive/10 hover:text-destructive"
              onClick={handleLogout}
              title={collapsed ? "Logout" : undefined}
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Logout</span>}
            </Button>
          </div>
        </>
      )}
    />
  );
}
