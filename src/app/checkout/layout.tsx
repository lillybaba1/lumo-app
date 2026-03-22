import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | JulaZone',
  description: 'Complete your purchase on JulaZone with secure payment options.',
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
