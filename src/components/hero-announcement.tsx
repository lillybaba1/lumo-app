"use client";

import Link from 'next/link';
import { cn } from '@/lib/utils';

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
  // Debug: Log settings to help troubleshoot
  console.log('HeroAnnouncement settings:', {
    enabled: settings.heroAnnouncementEnabled,
    text: settings.heroAnnouncementText,
  });

  if (!settings.heroAnnouncementEnabled || !settings.heroAnnouncementText) {
    return null;
  }

  const {
    heroAnnouncementText,
    heroAnnouncementBgColor = '#8b5cf6',
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
  const animationClass = animationMap[heroAnnouncementAnimation] || '';

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
        heroAnnouncementLink && "cursor-pointer hover:scale-105 hover:shadow-lg"
      )}
      style={{
        ...baseStyles,
        // Responsive width: mobile uses percentage, desktop uses fixed px
        width: `${heroAnnouncementMobileWidth}%`,
        maxWidth: `${heroAnnouncementWidth}px`,
      }}
    >
      {/* Responsive font sizes */}
      <span className="block md:hidden" style={{ fontSize: mobileFontSize }}>
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
