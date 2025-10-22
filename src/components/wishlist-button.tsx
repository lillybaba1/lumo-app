'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { addToWishlist, removeFromWishlist } from '@/services/wishlistService';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  productName: string;
  currentUserId?: string;
  isInWishlist?: boolean;
  variant?: 'icon' | 'button';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function WishlistButton({
  productId,
  productName,
  currentUserId,
  isInWishlist: initialIsInWishlist = false,
  variant = 'icon',
  size = 'icon',
  className,
}: WishlistButtonProps) {
  const [isInWishlist, setIsInWishlist] = useState(initialIsInWishlist);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleToggleWishlist = async () => {
    // TODO: Replace with actual auth when implemented
    if (!currentUserId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your wishlist.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await removeFromWishlist(currentUserId, productId);
        setIsInWishlist(false);
        toast({
          title: 'Removed from wishlist',
          description: `${productName} has been removed from your wishlist.`,
        });
      } else {
        await addToWishlist(currentUserId, productId);
        setIsInWishlist(true);
        toast({
          title: 'Added to wishlist',
          description: `${productName} has been added to your wishlist.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update wishlist. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (variant === 'button') {
    return (
      <Button
        variant={isInWishlist ? 'default' : 'outline'}
        size={size}
        onClick={handleToggleWishlist}
        disabled={isLoading}
        className={className}
      >
        <Heart
          className={cn(
            'h-4 w-4 mr-2',
            isInWishlist && 'fill-current'
          )}
        />
        {isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleToggleWishlist}
      disabled={isLoading}
      className={cn('hover:bg-background/80', className)}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-all',
          isInWishlist ? 'fill-red-500 text-red-500' : 'text-muted-foreground hover:text-red-500'
        )}
      />
    </Button>
  );
}
