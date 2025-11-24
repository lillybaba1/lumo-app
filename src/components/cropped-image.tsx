"use client";

import Image from 'next/image';
import { CSSProperties, useState, useEffect } from 'react';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedImageProps {
  src: string;
  alt: string;
  crop?: CropData;
  fill?: boolean;
  className?: string;
  style?: CSSProperties;
  priority?: boolean;
  sizes?: string;
  unoptimized?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * Component that displays an image with optional cropping applied
 * Uses CSS clip-path with percentage values for responsive cropping
 */
export default function CroppedImage({
  src,
  alt,
  crop,
  fill = false,
  className = '',
  style = {},
  priority = false,
  sizes,
  unoptimized = false,
  objectFit = 'cover',
}: CroppedImageProps) {
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (!crop || !src) return;

    // Load image to get natural dimensions for crop calculation
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      console.error('Failed to load image for crop calculation:', src);
    };
    img.src = src;
  }, [src, crop]);

  if (!crop || !imageDimensions) {
    // No crop or dimensions not loaded yet, render normally
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className={className}
        style={{ objectFit, ...style }}
        priority={priority}
        sizes={sizes}
        unoptimized={unoptimized}
      />
    );
  }

  // Calculate percentage-based clip-path for responsive cropping
  const topPercent = (crop.y / imageDimensions.height) * 100;
  const rightPercent = ((imageDimensions.width - crop.x - crop.width) / imageDimensions.width) * 100;
  const bottomPercent = ((imageDimensions.height - crop.y - crop.height) / imageDimensions.height) * 100;
  const leftPercent = (crop.x / imageDimensions.width) * 100;

  const croppedStyle: CSSProperties = {
    clipPath: `inset(${topPercent}% ${rightPercent}% ${bottomPercent}% ${leftPercent}%)`,
    objectFit,
    ...style,
  };

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      className={className}
      style={croppedStyle}
      priority={priority}
      sizes={sizes}
      unoptimized={unoptimized}
    />
  );
}
