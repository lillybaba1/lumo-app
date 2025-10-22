"use client";

import { Star } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export function StarRatingInput({ value, onChange, maxRating = 5, size = 'md', disabled = false }: StarRatingInputProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };

  const effectiveRating = hoverRating || value;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: maxRating }).map((_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= effectiveRating;

        return (
          <button
            key={index}
            type="button"
            disabled={disabled}
            onMouseEnter={() => !disabled && setHoverRating(starValue)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => !disabled && onChange(starValue)}
            className={cn(
              "transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary rounded",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled ? "fill-yellow-400 text-yellow-400" : "text-muted stroke-muted"
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="text-sm text-muted-foreground ml-2">
          {value} {value === 1 ? 'star' : 'stars'}
        </span>
      )}
    </div>
  );
}
