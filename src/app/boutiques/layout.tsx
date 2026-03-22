import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Browse Boutiques | JulaZone',
  description: 'Discover trusted seller boutiques on JulaZone. Find unique products from verified African merchants.',
  openGraph: {
    title: 'Browse Boutiques | JulaZone',
    description: 'Discover trusted seller boutiques on JulaZone – Africa\'s trusted marketplace.',
    type: 'website',
  },
};

export default function BoutiquesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
