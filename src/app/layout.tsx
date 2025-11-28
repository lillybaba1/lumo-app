import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AIAssistantWidget } from '@/components/ai-assistant-widget';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { getSiteSettings } from '@/services/settingsService';
import AuthMenu from '@/components/auth-menu';
import PublicSidebar from '@/components/public-sidebar';

export const metadata: Metadata = {
  title: 'Lumo',
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

// Force dynamic rendering for the entire app to avoid static pre-render
// errors for routes that rely on runtime features (cookies(), server
// APIs, etc.). This tells Next to render these pages at request-time
// instead of attempting static prerender during build.
export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the active theme from database settings
  const settings = await getSiteSettings();
  const initialTheme = settings?.theme || 'minimal-light';

  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider initialTheme={initialTheme}>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header>
                <AuthMenu />
              </Header>
              <div className="flex flex-1 pt-16 lg:pt-0">
                <PublicSidebar />
                <main className="flex-1 overflow-x-hidden">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            <Toaster />
            <AIAssistantWidget />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
