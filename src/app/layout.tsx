import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AIAssistantWidget } from '@/components/ai-assistant-widget';
import { SidebarProvider } from '@/components/ui/sidebar';
import UserSidebar from '@/components/user-sidebar';
import Header from '@/components/header';
import Footer from '@/components/footer';

export const metadata: Metadata = {
  title: 'Lumo',
  description: 'Your modern e-commerce experience.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <CartProvider>
          <SidebarProvider>
              <Header />
              <div className="flex">
                <UserSidebar />
                <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                  {children}
                </main>
              </div>
              <Footer />
            <Toaster />
            <AIAssistantWidget />
          </SidebarProvider>
        </CartProvider>
      </body>
    </html>
  );
}
