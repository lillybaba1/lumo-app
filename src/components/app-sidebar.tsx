"use client";

import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LucideIcon, Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: ReactNode;
};

export type SidebarSection = {
  label?: string;
  items: SidebarNavItem[];
};

type SidebarProps = {
  header?: (opts: { collapsed: boolean; closeSidebar: () => void }) => ReactNode;
  footer?: (opts: { collapsed: boolean }) => ReactNode;
  sections: SidebarSection[];
  activePath?: string;
  className?: string;
  mobileTitle?: string;
  mobileIcon?: ReactNode;
  defaultCollapsed?: boolean;
  mobileOffsetClassName?: string;
  mobileTopOffset?: string;
  onLogoClick?: () => void;
  /** Hide the mobile header bar — use when a parent already provides a header (e.g. Header component) */
  hideMobileHeader?: boolean;
};

export function AppSidebar({
  header,
  footer,
  sections,
  activePath,
  className,
  mobileTitle = 'Menu',
  mobileIcon,
  defaultCollapsed = false,
  mobileOffsetClassName = 'top-0',
  mobileTopOffset,
  onLogoClick,
  hideMobileHeader = false,
}: SidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Calculate the top offset for mobile sidebar/overlay
  // Extract numeric value from mobileOffsetClassName (e.g., "top-16" -> 64, "top-[104px]" -> 104)
  const getMobileOffset = (): string => {
    if (mobileTopOffset) return mobileTopOffset;
    if (mobileOffsetClassName.includes('[')) {
      const match = mobileOffsetClassName.match(/\[(\d+)px\]/);
      return match ? `${parseInt(match[1]) + 52}px` : '52px';
    }
    // Default tailwind top values: top-16 = 64px, so sidebar should be 64px + some buffer
    if (mobileOffsetClassName.includes('top-16')) return '116px';
    if (mobileOffsetClassName.includes('top-[104px]')) return '156px';
    return '52px';
  };

  const sidebarTopOffset = getMobileOffset();

  // Function to close the mobile sidebar
  const closeSidebar = () => {
    setMobileOpen(false);
  };

  const computedPath = useMemo(() => {
    if (activePath) return activePath;
    const search = searchParams?.toString();
    return search ? `${pathname || '/'}?${search}` : pathname || '/';
  }, [activePath, pathname, searchParams]);

  const [currentPath, currentSearch = ''] = computedPath.split('?');

  const isActive = useMemo(
    () => (href: string) => {
      const [hrefPath, hrefQuery = ''] = href.split('?');

      if (hrefPath === '/') {
        return currentPath === '/';
      }
      const pathMatch =
        currentPath === hrefPath ||
        currentPath.startsWith(`${hrefPath}/`);

      if (!hrefQuery) return pathMatch;
      return pathMatch && currentSearch.startsWith(hrefQuery);
    },
    [currentPath, currentSearch]
  );

  const SidebarContent = ({ isCollapsed }: { isCollapsed: boolean }) => (
    <div className="flex flex-col h-full bg-card/95 backdrop-blur-sm text-card-foreground">
      {header && (
        <div
          className={cn(
            "flex items-center gap-3 px-4 py-3 border-b bg-card",
            isCollapsed && "px-2 justify-center"
          )}
        >
          {header({ collapsed: isCollapsed, closeSidebar })}
        </div>
      )}

      <nav className="flex-grow px-3 py-6 overflow-y-auto">
        <div className="space-y-6">
          {sections.map((section, idx) => (
            <div key={section.label ?? idx}>
              {!isCollapsed && section.label && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {section.label}
                </h3>
              )}
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          "hover:bg-accent/50 hover:text-accent-foreground",
                          active && "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
                          !active && "text-muted-foreground",
                          isCollapsed && "justify-center"
                        )}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "drop-shadow")} />
                        {!isCollapsed && (
                          <>
                            <span className="truncate">{item.label}</span>
                            {item.badge && <span className="ml-auto">{item.badge}</span>}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>

      {footer && (
        <div className="border-t bg-muted/30">
          {footer({ collapsed: isCollapsed })}
        </div>
      )}
    </div>
  );

  return (
    <>
       {/* Mobile Header & Trigger — hidden when parent provides its own header */}
      {!hideMobileHeader && (
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b shadow-sm">
        <div className="flex items-center gap-3">
           <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
             <SheetTrigger asChild>
               <Button variant="ghost" size="icon" className="-ml-2">
                 <Menu className="h-6 w-6" />
                 <span className="sr-only">Open menu</span>
               </Button>
             </SheetTrigger>
             <SheetContent side="left" className="p-0 w-[280px]">
               <SidebarContent isCollapsed={false} />
             </SheetContent>
           </Sheet>
           
           <div className="flex items-center gap-2">
             {mobileIcon}
             <span className="font-semibold text-lg">{mobileTitle}</span>
           </div>
        </div>
      </div>
      )}

      {/* Desktop Sidebar - with subtle glass effect */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 border-r bg-card/95 backdrop-blur-sm text-card-foreground transition-all duration-300 ease-in-out z-40",
          collapsed ? "w-[4.5rem]" : "w-72",
          "min-h-screen sticky top-0 h-screen",
          className
        )}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:shadow-lg transition-all"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>

        <SidebarContent isCollapsed={collapsed} />
      </aside>
    </>
  );
}
