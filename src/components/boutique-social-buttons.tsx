'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  followBoutique,
  unfollowBoutique,
  likeBoutique,
  unlikeBoutique,
  getBoutiqueSocialStats,
} from '@/services/boutiqueSocialService';
import { cn } from '@/lib/utils';

interface BoutiqueSocialButtonsProps {
  boutiqueId: string;
  initialFollowerCount?: number;
  initialLikeCount?: number;
  isAuthenticated?: boolean;
  className?: string;
}

export function BoutiqueSocialButtons({
  boutiqueId,
  initialFollowerCount = 0,
  initialLikeCount = 0,
  isAuthenticated = false,
  className,
}: BoutiqueSocialButtonsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial state
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getBoutiqueSocialStats(boutiqueId);
        setFollowerCount(stats.followerCount);
        setLikeCount(stats.likeCount);
        setIsFollowing(stats.isFollowing);
        setHasLiked(stats.hasLiked);
      } catch (error) {
        console.error('Error loading social stats:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    loadStats();
  }, [boutiqueId]);

  const handleFollow = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow this boutique.',
        variant: 'default',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsLoadingFollow(true);
    try {
      if (isFollowing) {
        const result = await unfollowBoutique(boutiqueId);
        if (result.success) {
          setIsFollowing(false);
          setFollowerCount(prev => Math.max(0, prev - 1));
          toast({
            title: 'Unfollowed',
            description: 'You are no longer following this boutique.',
          });
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      } else {
        const result = await followBoutique(boutiqueId);
        if (result.success) {
          setIsFollowing(true);
          setFollowerCount(prev => prev + 1);
          toast({
            title: 'Following!',
            description: 'You will be notified about new products.',
          });
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to like this boutique.',
        variant: 'default',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsLoadingLike(true);
    try {
      if (hasLiked) {
        const result = await unlikeBoutique(boutiqueId);
        if (result.success) {
          setHasLiked(false);
          setLikeCount(prev => Math.max(0, prev - 1));
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      } else {
        const result = await likeBoutique(boutiqueId);
        if (result.success) {
          setHasLiked(true);
          setLikeCount(prev => prev + 1);
          toast({
            title: '❤️ Liked!',
            description: 'Added to your favorites.',
          });
        } else {
          toast({ title: 'Error', description: result.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoadingLike(false);
    }
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Like Button */}
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "rounded-full transition-all",
          hasLiked && "bg-red-50 border-red-200 text-red-500 hover:bg-red-100 hover:text-red-600"
        )}
        onClick={handleLike}
        disabled={isLoadingLike || !isInitialized}
      >
        {isLoadingLike ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Heart className={cn("h-5 w-5", hasLiked && "fill-current")} />
        )}
      </Button>

      {/* Follow Button */}
      <Button
        variant={isFollowing ? "default" : "outline"}
        size="sm"
        className={cn(
          "rounded-full gap-1.5 transition-all",
          isFollowing && "bg-primary text-primary-foreground"
        )}
        onClick={handleFollow}
        disabled={isLoadingFollow || !isInitialized}
      >
        {isLoadingFollow ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isFollowing ? (
          <>
            <UserMinus className="h-4 w-4" />
            Following
          </>
        ) : (
          <>
            <UserPlus className="h-4 w-4" />
            Follow
          </>
        )}
      </Button>
    </div>
  );
}

interface FollowButtonProps {
  boutiqueId: string;
  isAuthenticated?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg';
}

export function FollowButton({
  boutiqueId,
  isAuthenticated = false,
  className,
  size = 'default',
}: FollowButtonProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function checkFollowing() {
      try {
        const stats = await getBoutiqueSocialStats(boutiqueId);
        setIsFollowing(stats.isFollowing);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    checkFollowing();
  }, [boutiqueId]);

  const handleClick = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow this boutique.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    setIsLoading(true);
    try {
      if (isFollowing) {
        const result = await unfollowBoutique(boutiqueId);
        if (result.success) {
          setIsFollowing(false);
          toast({ title: 'Unfollowed', description: 'You are no longer following this boutique.' });
        }
      } else {
        const result = await followBoutique(boutiqueId);
        if (result.success) {
          setIsFollowing(true);
          toast({ title: 'Following!', description: 'You will be notified about new products.' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={isFollowing ? "secondary" : "default"}
      size={size}
      className={cn("gap-2", className)}
      onClick={handleClick}
      disabled={isLoading || !isInitialized}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className={cn("h-4 w-4", isFollowing && "fill-current text-red-500")} />
      )}
      {isFollowing ? 'Following' : 'Follow This Boutique'}
    </Button>
  );
}
