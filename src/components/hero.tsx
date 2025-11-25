"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

type HeroSettings = {
  heroHeading?: string;
  heroTagline?: string;
  heroBackgroundImage?: string;
  heroImageObjectPosition?: string;
};

export default function Hero() {
  const [settings, setSettings] = useState<HeroSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hero settings from API
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load hero settings:', err);
        setLoading(false);
      });
  }, []);

  // Default values if settings haven't loaded yet
  const heroHeading = settings?.heroHeading || 'Step into Lumo';
  const heroTagline = settings?.heroTagline || 'Discover exceptional products crafted with care. Your journey to quality starts here.';
  const heroBackgroundImage = settings?.heroBackgroundImage || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop';
  const heroImageObjectPosition = settings?.heroImageObjectPosition || 'center';

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        borderRadius: 'var(--radius-hero)',
        marginBottom: 'var(--spacing-3xl)',
      }}
    >
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-no-repeat"
        style={{
          backgroundImage: `url(${heroBackgroundImage})`,
          backgroundPosition: heroImageObjectPosition,
        }}
      >
        {/* Gradient Overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, var(--color-hero-overlay) 0%, var(--color-hero-overlay) 40%, transparent 100%)',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-24 md:py-32 lg:py-40">
          <div className="max-w-2xl">
            {/* Heading */}
            <h1
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
              style={{
                color: 'var(--color-text-inverse)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 'var(--font-weight-bold)',
                lineHeight: 'var(--line-height-tight)',
              }}
            >
              {heroHeading}
            </h1>

            {/* Tagline */}
            <p
              className="text-lg md:text-xl mb-8 max-w-xl"
              style={{
                color: 'var(--color-text-inverse)',
                opacity: 0.95,
                lineHeight: 'var(--line-height-relaxed)',
              }}
            >
              {heroTagline}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products?filter=new">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base font-semibold"
                  style={{
                    backgroundColor: 'var(--button-primary-bg)',
                    color: 'var(--button-primary-fg)',
                    borderRadius: 'var(--radius-button)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                  }}
                >
                  Shop New Arrivals
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>

              <Link href="/products">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto text-base font-semibold"
                  style={{
                    backgroundColor: 'var(--button-secondary-bg)',
                    color: 'var(--color-text-inverse)',
                    borderColor: 'var(--color-text-inverse)',
                    borderRadius: 'var(--radius-button)',
                    padding: 'var(--spacing-md) var(--spacing-xl)',
                  }}
                >
                  Browse Collections
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
