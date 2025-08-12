
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { CartProvider } from '@/context/cart-context';
import { AIAssistantWidget } from '@/components/ai-assistant-widget';
import { SidebarProvider } from '@/components/ui/sidebar';
import UserSidebar from '@/components/user-sidebar';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { getTheme } from '@/app/admin/appearance/actions';
import { hexToHsl } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Lumo',
  description: 'Your modern e-commerce experience.',
};

const defaultTheme = {
  primaryColor: "#D0BFFF",
  accentColor: "#FFB3C6",
  backgroundColor: "#E8E2FF",
  backgroundImage: "https://placehold.co/1200x800.png",
  foregroundImage: "https://placehold.co/400x400.png",
  foregroundImageScale: 100,
  foregroundImagePositionX: 50,
  foregroundImagePositionY: 50,
};


export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme() ?? defaultTheme;
  const primaryHsl = hexToHsl(theme.primaryColor);
  const accentHsl = hexToHsl(theme.accentColor);
  const backgroundHsl = hexToHsl(theme.backgroundColor);

  const themeStyle = {
    '--primary': `${primaryHsl.h} ${primaryHsl.s}% ${primaryHsl.l}%`,
    '--accent': `${accentHsl.h} ${accentHsl.s}% ${accentHsl.l}%`,
    '--background': `${backgroundHsl.h} ${backgroundHsl.s}% ${backgroundHsl.l}%`,
  } as React.CSSProperties;


  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Belleza&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased" style={themeStyle}>
        <CartProvider>
          <SidebarProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <div className="flex flex-1">
                <UserSidebar />
                <main className="flex-1">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
            <Toaster />
            <AIAssistantWidget />
          </SidebarProvider>
        </CartProvider>
      </body>
    </html>
  );
}
