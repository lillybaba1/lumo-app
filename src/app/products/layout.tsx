import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products | JulaZone',
  description: 'Browse our wide selection of quality products on JulaZone – Africa\'s trusted marketplace. Find the best deals on electronics, fashion, home goods, and more.',
  openGraph: {
    title: 'Shop All Products | JulaZone',
    description: 'Browse our wide selection of quality products on JulaZone – Africa\'s trusted marketplace.',
    type: 'website',
  },
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
