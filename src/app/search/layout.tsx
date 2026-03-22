import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Products | JulaZone',
  description: 'Search for products across all categories on JulaZone – Africa\'s trusted marketplace.',
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
