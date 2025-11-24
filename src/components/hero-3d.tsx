
"use client";

import { useState, useEffect } from 'react';
import CroppedImage from './cropped-image';

type CropData = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Hero3DProps = {
  theme: {
    backgroundImage: string;
    foregroundImage: string;
    foregroundImageScale?: number;
    foregroundImagePositionX?: number;
    foregroundImagePositionY?: number;
    backgroundImageCrop?: CropData;
    foregroundImageCrop?: CropData;
    updatedAt?: string;
  };
};

export default function Hero3D({ theme }: Hero3DProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined') return;
      const { innerWidth: width, innerHeight: height } = window;
      const { clientX: x, clientY: y } = e;

      const xRotation = 20 * ((y - height / 2) / height);
      const yRotation = 20 * ((x - width / 2) / width);

      setRotate({ x: -xRotation, y: yRotation });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const sectionStyle = {
    transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
    transition: 'transform 0.1s ease',
  };
  
  const foregroundContainerStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${theme.foregroundImagePositionX ?? 50}%`,
    top: `${theme.foregroundImagePositionY ?? 50}%`,
    width: `${(theme.foregroundImageScale ?? 100) / 4}%`,
    transform: `translate(-50%, -50%)`,
    transformStyle: 'preserve-3d',
  };

  const foregroundImageStyle: React.CSSProperties = {
    transform: 'translateZ(50px)',
    transition: 'transform 0.1s ease',
  };

  const textStyle = {
    transform: 'translateZ(75px)',
    transition: 'transform 0.1s ease',
  };

  // Add cache-busting query parameter based on theme update time
  const addCacheBuster = (url: string) => {
    if (!url) return url;
    const timestamp = theme.updatedAt ? new Date(theme.updatedAt).getTime() : Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${timestamp}`;
  };

  // Note: Crop data is saved and can be used for server-side image processing
  // For now, images are displayed in full. Future enhancement: apply crops visually using canvas or server-side processing

  return (
    <div style={{ perspective: '1000px' }} className="w-full min-h-[70vh] md:min-h-[60vh] flex items-center justify-center p-4">
      <section
        className="relative w-full h-[65vh] md:h-[55vh] flex items-center justify-center text-white overflow-hidden rounded-2xl shadow-2xl"
        style={sectionStyle}
      >
        {theme.backgroundImage ? (
          <CroppedImage
            src={addCacheBuster(theme.backgroundImage)}
            alt="Background"
            crop={theme.backgroundImageCrop}
            fill
            className="z-0 transform-gpu"
            objectFit="cover"
            sizes="100vw"
            priority
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 z-0"></div>
        )}
        <div className="absolute inset-0 bg-black/40 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-center md:text-left" style={textStyle}>
            <h1 className="font-headline text-4xl md:text-7xl font-bold tracking-tight drop-shadow-lg">Step into Lumo</h1>
            <p className="mt-4 md:mt-6 text-base md:text-xl max-w-2xl drop-shadow-md mx-auto md:mx-0">An immersive shopping experience designed just for you. Explore our collections in a new dimension.</p>
          </div>
          <div className="relative h-full w-full hidden md:block">
            {theme.foregroundImage && (
              <div style={foregroundContainerStyle}>
                <div className="relative w-full h-auto" style={{...foregroundImageStyle, paddingTop: '100%'}}>
                    <CroppedImage
                    src={addCacheBuster(theme.foregroundImage)}
                    alt="Featured Product"
                    crop={theme.foregroundImageCrop}
                    fill
                    className="drop-shadow-2xl transform-gpu"
                    objectFit="contain"
                    unoptimized
                    sizes="33vw"
                    />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
    
