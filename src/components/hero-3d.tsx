"use client";

import Image from 'next/image';
import { useState, useEffect } from 'react';

type Hero3DProps = {
  theme: {
    backgroundImage: string;
    foregroundImage: string;
  };
};

export default function Hero3D({ theme }: Hero3DProps) {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
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

  const foregroundImageStyle = {
    transform: 'translateZ(50px) scale(0.9)',
    transition: 'transform 0.1s ease',
  };
  
  const textStyle = {
    transform: 'translateZ(75px)',
    transition: 'transform 0.1s ease',
  };

  return (
    <div style={{ perspective: '1000px' }} className="w-full min-h-[60vh] flex items-center justify-center">
      <section
        className="relative w-[95%] h-[55vh] flex items-center justify-center text-white overflow-hidden rounded-2xl shadow-2xl"
        style={sectionStyle}
      >
        {theme.backgroundImage ? (
          <Image
            src={theme.backgroundImage}
            alt="Background"
            layout="fill"
            objectFit="cover"
            className="z-0 transform-gpu"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 z-0"></div>
        )}
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        <div className="relative z-20 container mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="text-left" style={textStyle}>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight drop-shadow-lg">Discover Your Style</h1>
            <p className="mt-6 text-lg md:text-xl max-w-2xl drop-shadow-md">Browse our curated collection of the latest trends in fashion, electronics, beauty, and more.</p>
          </div>
          <div className="flex justify-center" style={{transformStyle: 'preserve-3d'}}>
            {theme.foregroundImage && (
              <div className="relative w-64 h-64 md:w-80 md:h-80" style={foregroundImageStyle}>
                <Image
                  src={theme.foregroundImage}
                  alt="Featured Product"
                  layout="fill"
                  objectFit="contain"
                  className="drop-shadow-2xl transform-gpu"
                />
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}