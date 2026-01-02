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

// Optimized font loading with next/font - prevents FOUT (Flash of Unstyled Text)
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Generate dynamic metadata including favicon from admin settings
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSiteSettings();
    
    // Use uploaded favicon or fallback to default
    const faviconUrl = settings?.faviconUrl || '/icon.svg';
    const siteName = settings?.storeName || 'JulaZone';
    
    return {
      title: siteName,
      description: 'Your modern e-commerce experience.',
      icons: {
        icon: [
          { url: faviconUrl },
        ],
        apple: [
          { url: faviconUrl },
        ],
        shortcut: faviconUrl,
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
        {/* Preload hero image for faster LCP */}
        {heroBackgroundImage && (
          <link rel="preload" as="image" href={heroBackgroundImage} fetchPriority="high" />
        )}
      </head>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider initialTheme={initialTheme}>
          <SettingsProvider initialSettings={{ currency: settings?.currency, storeName: settings?.storeName }}>
            <CartProvider>
              <LocationProvider>
              <div className="flex min-h-screen flex-col">
                <Header>
                  {null}
                </Header>
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
              <AIAssistantWidget />
              <CookieConsent />
              <VisitorTracker />
              </LocationProvider>
            </CartProvider>
          </SettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
