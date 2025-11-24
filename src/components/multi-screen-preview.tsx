"use client";

import { useState } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CroppedImage from './cropped-image';
import { cn } from '@/lib/utils';

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface MultiScreenPreviewProps {
  backgroundImage: string;
  foregroundImage: string;
  backgroundCrop?: CropData;
  foregroundCrop?: CropData;
  fgScale: number;
  fgPosX: number;
  fgPosY: number;
}

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const SCREEN_SIZES = {
  mobile: { width: 375, height: 667, label: 'Mobile', icon: Smartphone },
  tablet: { width: 768, height: 1024, label: 'Tablet', icon: Tablet },
  desktop: { width: 1920, height: 1080, label: 'Desktop', icon: Monitor },
};

export default function MultiScreenPreview({
  backgroundImage,
  foregroundImage,
  backgroundCrop,
  foregroundCrop,
  fgScale,
  fgPosX,
  fgPosY,
}: MultiScreenPreviewProps) {
  const [selectedSize, setSelectedSize] = useState<ScreenSize>('desktop');

  const screenConfig = SCREEN_SIZES[selectedSize];
  const aspectRatio = screenConfig.width / screenConfig.height;

  const foregroundPreviewStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${fgPosX}%`,
    top: `${fgPosY}%`,
    width: `${fgScale}%`,
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className="space-y-4">
      {/* Screen Size Selector */}
      <div className="flex gap-2 justify-center">
        {(Object.keys(SCREEN_SIZES) as ScreenSize[]).map((size) => {
          const Icon = SCREEN_SIZES[size].icon;
          return (
            <Button
              key={size}
              type="button"
              variant={selectedSize === size ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSize(size)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {SCREEN_SIZES[size].label}
            </Button>
          );
        })}
      </div>

      {/* Preview Container */}
      <div className="flex items-center justify-center bg-muted/30 p-8 rounded-lg">
        <div
          className="relative bg-white shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: selectedSize === 'mobile' ? '100%' : selectedSize === 'tablet' ? '80%' : '100%',
            maxWidth: selectedSize === 'mobile' ? '375px' : selectedSize === 'tablet' ? '768px' : '100%',
            aspectRatio: aspectRatio,
          }}
        >
          {/* Background Image */}
          {backgroundImage && (
            <div className="absolute inset-0">
              <CroppedImage
                src={backgroundImage}
                alt="Background Preview"
                crop={backgroundCrop}
                fill
                objectFit="cover"
                unoptimized
              />
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30"></div>

          {/* Foreground Image - Hidden on mobile like in actual hero */}
          {foregroundImage && selectedSize !== 'mobile' && (
            <div style={foregroundPreviewStyle} className="absolute">
              <div className="relative w-full h-full" style={{ paddingBottom: '100%' }}>
                <CroppedImage
                  src={foregroundImage}
                  alt="Foreground Preview"
                  crop={foregroundCrop}
                  fill
                  objectFit="contain"
                  unoptimized
                />
              </div>
            </div>
          )}

          {/* Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-white p-4 bg-black/20 rounded-lg">
              <h3
                className={cn(
                  'font-headline font-bold',
                  selectedSize === 'mobile' ? 'text-xl' : selectedSize === 'tablet' ? 'text-3xl' : 'text-4xl'
                )}
              >
                Hero Title
              </h3>
              <p className={cn('mt-2', selectedSize === 'mobile' ? 'text-xs' : 'text-sm')}>
                Hero description text.
              </p>
            </div>
          </div>

          {/* Screen size indicator */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
            {screenConfig.width} × {screenConfig.height}
          </div>
        </div>
      </div>
    </div>
  );
}
