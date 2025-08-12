
"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Hero3DProps = {
  theme: {
    backgroundImage: string;
    foregroundImage: string;
    foregroundImageScale?: number;
    foregroundImagePositionX?: number;
    foregroundImagePositionY?: number;
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

  const foregroundImageStyle: React.CSSProperties = {
    transform: 'translateZ(50px) scale(0.9)',
    transition: 'transform 0.1s ease',
  };
  
  const foregroundContainerStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    left: `${theme.foregroundImagePositionX ?? 50}%`,
    top: `${theme.foregroundImagePositionY ?? 50}%`,
    transform: `translate(-50%, -50%) scale(${ (theme.foregroundImageScale ?? 100) / 100})`,
    position: 'absolute'
  };

  const textStyle = {
    transform: 'translateZ(75px)',
    transition: 'transform 0.1s ease',
  };

  return (
    <div style={{ perspective: '1000px' }} className="w-full min-h-[70vh] md:min-h-[60vh] flex items-center justify-center p-4">
      <section
        className="relative w-full h-[65vh] md:h-[55vh] flex items-center justify-center text-white overflow-hidden rounded-2xl shadow-2xl"
        style={sectionStyle}
      >
        {theme.backgroundImage ? (
          <Image
            src={theme.backgroundImage}
            alt="Background"
            fill
            className="object-cover z-0 transform-gpu"
            sizes="100vw"
            priority
            
            unoptimized
            data-ai-hint="modern room"
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
                <div className="relative w-48 h-48 md:w-80 md:h-80" style={foregroundImageStyle}>
                    <Image
                    src={theme.foregroundImage}
                    alt="Featured Product"
                    fill
                    className="object-contain drop-shadow-2xl transform-gpu"
                    unoptimized
                    sizes="100vw"
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
