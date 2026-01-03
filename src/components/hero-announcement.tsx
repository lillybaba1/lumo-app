"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ANNOUNCEMENT_DISMISSED_KEY = 'hero-announcement-dismissed';

export interface HeroAnnouncementSettings {
  heroAnnouncementEnabled?: boolean;
  heroAnnouncementText?: string;
  heroAnnouncementBgColor?: string;
  heroAnnouncementTextColor?: string;
  heroAnnouncementBorderColor?: string;
  heroAnnouncementBorderRadius?: number;
  heroAnnouncementFontSize?: string;
  heroAnnouncementFontWeight?: string;
  heroAnnouncementPositionX?: number;
  heroAnnouncementPositionY?: number;
  heroAnnouncementWidth?: number;
  heroAnnouncementPadding?: string;
  heroAnnouncementMobileWidth?: number;
  heroAnnouncementMobileFontSize?: string;
  heroAnnouncementLink?: string;
  heroAnnouncementShadow?: boolean;
  heroAnnouncementAnimation?: string;
}

interface HeroAnnouncementProps {
  settings: HeroAnnouncementSettings;
}

export default function HeroAnnouncement({ settings }: HeroAnnouncementProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
  const [isVisible, setIsVisible] = useState(false);

  // Check sessionStorage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(ANNOUNCEMENT_DISMISSED_KEY);
    if (!dismissed) {
      setIsDismissed(false);
      // Small delay for smooth entrance
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    // Wait for fade out animation before hiding
    setTimeout(() => {
      setIsDismissed(true);
      sessionStorage.setItem(ANNOUNCEMENT_DISMISSED_KEY, 'true');
    }, 300);
  };

  if (!settings.heroAnnouncementEnabled || !settings.heroAnnouncementText || isDismissed) {
    return null;
  }

  const {
    heroAnnouncementText,
    heroAnnouncementBgColor = '#4F46E5',
    heroAnnouncementTextColor = '#ffffff',
    heroAnnouncementBorderColor = '#ffffff',
    heroAnnouncementBorderRadius = 12,
    heroAnnouncementFontSize = 'base',
    heroAnnouncementFontWeight = 'semibold',
    heroAnnouncementPositionX = 50,
    heroAnnouncementPositionY = 10,
    heroAnnouncementWidth = 400,
    heroAnnouncementPadding = 'md',
    heroAnnouncementMobileWidth = 90,
    heroAnnouncementMobileFontSize = 'sm',
    heroAnnouncementLink,
    heroAnnouncementShadow = true,
    heroAnnouncementAnimation = 'none',
  } = settings;

  // Map font size strings to pixel values
  const fontSizePixelMap: Record<string, string> = {
    xs: '12px',
    sm: '14px',
    base: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
  };

  // Map font weight strings to Tailwind classes
  const fontWeightMap: Record<string, string> = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Map padding strings to Tailwind classes
  const paddingMap: Record<string, string> = {
    sm: 'px-3 py-1.5',
    md: 'px-4 py-2',
    lg: 'px-6 py-3',
  };

  // Map animation strings to Tailwind/CSS classes
  const animationMap: Record<string, string> = {
    none: '',
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    shake: 'animate-shake',
  };

  const desktopFontSize = fontSizePixelMap[heroAnnouncementFontSize] || '16px';
  const mobileFontSize = fontSizePixelMap[heroAnnouncementMobileFontSize] || '14px';
  const fontWeightClass = fontWeightMap[heroAnnouncementFontWeight] || 'font-semibold';
  const paddingClass = paddingMap[heroAnnouncementPadding] || 'px-4 py-2';
  const animationClass = isVisible ? (animationMap[heroAnnouncementAnimation] || '') : '';

  // Calculate transform based on position for centering
  const getTransform = () => {
    let transform = '';
    if (heroAnnouncementPositionX === 50) {
      transform += 'translateX(-50%) ';
    } else if (heroAnnouncementPositionX > 50) {
      transform += `translateX(-${(heroAnnouncementPositionX - 50) * 2}%) `;
    }
    return transform.trim() || 'none';
  };

  const baseStyles: React.CSSProperties = {
    backgroundColor: heroAnnouncementBgColor,
    color: heroAnnouncementTextColor,
    borderColor: heroAnnouncementBorderColor,
    borderRadius: `${heroAnnouncementBorderRadius}px`,
    left: `${heroAnnouncementPositionX}%`,
    top: `${heroAnnouncementPositionY}%`,
    transform: getTransform(),
    boxShadow: heroAnnouncementShadow ? '0 4px 20px rgba(0, 0, 0, 0.3)' : 'none',
  };

  const content = (
    <div
      className={cn(
        "absolute z-50 border-2 text-center transition-all duration-300",
        paddingClass,
        fontWeightClass,
        animationClass,
        heroAnnouncementLink && "cursor-pointer hover:scale-105 hover:shadow-lg",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}
      style={{
        ...baseStyles,
        // Responsive width: mobile uses percentage, desktop uses fixed px
        width: `${heroAnnouncementMobileWidth}%`,
        maxWidth: `${heroAnnouncementWidth}px`,
      }}
    >
      {/* Close button */}
      <button
        onClick={handleDismiss}
        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
        style={{ color: heroAnnouncementTextColor }}
        aria-label="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
      
      {/* Responsive font sizes */}
      <span className="block md:hidden pr-4" style={{ fontSize: mobileFontSize }}>
        {heroAnnouncementText}
      </span>
      <span className="hidden md:block" style={{ fontSize: desktopFontSize }}>
        {heroAnnouncementText}
      </span>
    </div>
  );

  if (heroAnnouncementLink) {
    return (
      <Link href={heroAnnouncementLink} className="contents">
        {content}
      </Link>
    );
  }

  return content;
}
