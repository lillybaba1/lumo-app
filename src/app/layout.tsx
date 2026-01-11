import type { Metadata } from 'next';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { SettingsProvider } from '@/context/settings-context';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { getSiteSettings } from '@/services/settingsService';
import PublicSidebar from '@/components/public-sidebar';
import { LocationProvider } from '@/components/location-consent';

// Dynamic imports for heavy components - only loads when needed
const AIAssistantWidget = dynamic(
  () => import('@/components/ai-assistant-widget').then((mod) => mod.AIAssistantWidget),
  { ssr: false } // Client-only, no server render needed
);

const CookieConsent = dynamic(
  () => import('@/components/cookie-consent').then((mod) => mod.CookieConsent),
  { ssr: false }
);

const VisitorTracker = dynamic(
  () => import('@/components/visitor-tracker').then((mod) => mod.VisitorTracker),
  { ssr: false }
);

// Bottom navigation for mobile - Amazon-style fixed nav
const BottomNavigation = dynamic(
  () => import('@/components/bottom-navigation'),
  { ssr: false }
);

// Capacitor back button handler for Android app
const CapacitorBackButton = dynamic(
  () => import('@/components/capacitor-back-button'),
  { ssr: false }
);

// Optimized font loading with next/font - prevents FOUT (Flash of Unstyled Text)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Generate dynamic metadata including favicon from admin settings
// Default favicon is inlined as data URL for instant loading (no network request)
// Purple shopping bag icon matching the JulaZone brand
const DEFAULT_FAVICON_SVG = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="10" fill="%239333ea"/><path d="M14 18h20l-2 16H16L14 18z" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 18v-4a6 6 0 0 1 12 0v4" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"/><circle cx="20" cy="24" r="1.5" fill="white"/><circle cx="28" cy="24" r="1.5" fill="white"/></svg>';

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    const siteName = settings?.storeName || 'JulaZone';
    
    // Always use /icon.svg - no admin override for favicon
    return {
      title: siteName,
      description: 'Your modern e-commerce experience.',
      icons: {
        icon: [
          { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        apple: [
          { url: '/icon.svg' },
        ],
        shortcut: '/icon.svg',
      },
    };
  } catch (error) {
    // Fallback if settings fetch fails
    return {
      title: 'JulaZone',
      description: 'Your modern e-commerce experience.',
      icons: {
        icon: [
          { url: '/icon.svg', type: 'image/svg+xml' },
        ],
        apple: [
          { url: '/icon.svg', type: 'image/svg+xml' },
        ],
      },
    };
  }
}

// Note: force-dynamic has been moved to individual routes that need it
// (e.g., routes using cookies(), headers(), or server actions)
// This allows Next.js to statically optimize pages where possible

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the active theme from database settings
  const settings = await getSiteSettings();
  const initialTheme = settings?.theme || 'minimal-light';
  const heroBackgroundImage = settings?.heroBackgroundImage || '';

  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <head>
        {/* Viewport with safe area support for mobile apps */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {/* Preload hero image for faster LCP */}
        {heroBackgroundImage && (
          <link rel="preload" as="image" href={heroBackgroundImage} fetchPriority="high" />
        )}
        {/* Preload custom favicon if set (from Supabase storage) */}
        {settings?.faviconUrl && (
          <link rel="preload" as="image" href={settings.faviconUrl} fetchPriority="high" />
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <SettingsProvider initialSettings={{ currency: settings?.currency, storeName: settings?.storeName }}>
            <CartProvider>
              <LocationProvider>
              <div className="flex min-h-screen flex-col">
                <Header />
                <div className="flex flex-1 pt-16">
                  <Suspense fallback={<div className="w-64 hidden lg:block" />}>
                    <PublicSidebar />
                  </Suspense>
                  <main className="flex-1 overflow-x-hidden pt-12 lg:pt-0">
                    {children}
                  </main>
                </div>
                <Footer />
              </div>
              <Toaster />
              <BottomNavigation />
              <AIAssistantWidget />
              <CookieConsent />
              <VisitorTracker />
              <CapacitorBackButton />
              </LocationProvider>
            </CartProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
