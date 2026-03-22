import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Shopping Cart | JulaZone',
  description: 'Review items in your cart and proceed to checkout on JulaZone.',
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
