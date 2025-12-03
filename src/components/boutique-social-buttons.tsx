'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, UserPlus, UserMinus, Loader2, Bell, BellOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  followBoutique,
  unfollowBoutique,
  likeBoutique,
  unlikeBoutique,
  getBoutiqueSocialStats,
  toggleFollowNotifications,
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hasLiked, setHasLiked] = useState(false);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLoadingFollow, setIsLoadingFollow] = useState(false);
  const [isLoadingLike, setIsLoadingLike] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load initial state
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await getBoutiqueSocialStats(boutiqueId);
        setFollowerCount(stats.followerCount);
        setLikeCount(stats.likeCount);
        setIsFollowing(stats.isFollowing);
        setNotificationsEnabled(stats.notificationsEnabled);
        setHasLiked(stats.hasLiked);
      } catch (error) {
        console.error('Error loading social stats:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    loadStats();
  }, [boutiqueId]);

  const handleFollow = async (withNotifications: boolean = true) => {
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
      const result = await followBoutique(boutiqueId, withNotifications);
      if (result.success) {
        setIsFollowing(true);
        setNotificationsEnabled(withNotifications);
        setFollowerCount(prev => prev + 1);
        toast({
          title: 'Following!',
          description: withNotifications 
            ? 'You will be notified about new products and updates.' 
            : 'You are now following this boutique.',
        });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoadingFollow(true);
    try {
      const result = await unfollowBoutique(boutiqueId);
      if (result.success) {
        setIsFollowing(false);
        setNotificationsEnabled(true);
        setFollowerCount(prev => Math.max(0, prev - 1));
        toast({
          title: 'Unfollowed',
          description: 'You are no longer following this boutique.',
        });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsLoadingFollow(false);
    }
  };

  const handleToggleNotifications = async () => {
    setIsLoadingNotifications(true);
    try {
      const newValue = !notificationsEnabled;
      const result = await toggleFollowNotifications(boutiqueId, newValue);
      if (result.success) {
        setNotificationsEnabled(newValue);
        toast({
          title: newValue ? 'Notifications enabled' : 'Notifications disabled',
          description: newValue 
            ? 'You will receive notifications from this boutique.'
            : 'You will no longer receive notifications from this boutique.',
        });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsLoadingNotifications(false);
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

      {/* Follow Button with Dropdown */}
      {isFollowing ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              className="rounded-full gap-1.5 transition-all bg-primary text-primary-foreground"
              disabled={isLoadingFollow || !isInitialized}
            >
              {isLoadingFollow ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {notificationsEnabled ? (
                    <Bell className="h-4 w-4" />
                  ) : (
                    <BellOff className="h-4 w-4" />
                  )}
                  Following
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={handleToggleNotifications}
              disabled={isLoadingNotifications}
            >
              {isLoadingNotifications ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : notificationsEnabled ? (
                <BellOff className="h-4 w-4 mr-2" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              {notificationsEnabled ? 'Turn off notifications' : 'Turn on notifications'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleUnfollow}
              className="text-destructive focus:text-destructive"
            >
              <UserMinus className="h-4 w-4 mr-2" />
              Unfollow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5 transition-all"
              disabled={isLoadingFollow || !isInitialized}
            >
              {isLoadingFollow ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Follow
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => handleFollow(true)}>
              <Bell className="h-4 w-4 mr-2" />
              Follow with notifications
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleFollow(false)}>
              <BellOff className="h-4 w-4 mr-2" />
              Follow without notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
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
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function checkFollowing() {
      try {
        const stats = await getBoutiqueSocialStats(boutiqueId);
        setIsFollowing(stats.isFollowing);
        setNotificationsEnabled(stats.notificationsEnabled);
      } catch (error) {
        console.error('Error checking follow status:', error);
      } finally {
        setIsInitialized(true);
      }
    }
    checkFollowing();
  }, [boutiqueId]);

  const handleFollow = async (withNotifications: boolean) => {
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
      const result = await followBoutique(boutiqueId, withNotifications);
      if (result.success) {
        setIsFollowing(true);
        setNotificationsEnabled(withNotifications);
        toast({ 
          title: 'Following!', 
          description: withNotifications 
            ? 'You will be notified about new products.' 
            : 'You are now following this boutique.'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setIsLoading(true);
    try {
      const result = await unfollowBoutique(boutiqueId);
      if (result.success) {
        setIsFollowing(false);
        toast({ title: 'Unfollowed', description: 'You are no longer following this boutique.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleNotifications = async () => {
    setIsLoading(true);
    try {
      const newValue = !notificationsEnabled;
      const result = await toggleFollowNotifications(boutiqueId, newValue);
      if (result.success) {
        setNotificationsEnabled(newValue);
        toast({
          title: newValue ? 'Notifications enabled' : 'Notifications disabled',
          description: newValue 
            ? 'You will receive notifications from this boutique.'
            : 'You will no longer receive notifications.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isFollowing) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size={size}
            className={cn("gap-2", className)}
            disabled={isLoading || !isInitialized}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : notificationsEnabled ? (
              <Bell className="h-4 w-4" />
            ) : (
              <BellOff className="h-4 w-4" />
            )}
            Following
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-48">
          <DropdownMenuItem onClick={handleToggleNotifications}>
            {notificationsEnabled ? (
              <>
                <BellOff className="h-4 w-4 mr-2" />
                Turn off notifications
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Turn on notifications
              </>
            )}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleUnfollow}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Unfollow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          size={size}
          className={cn("gap-2", className)}
          disabled={isLoading || !isInitialized}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Heart className="h-4 w-4" />
          )}
          Follow This Boutique
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuItem onClick={() => handleFollow(true)}>
          <Bell className="h-4 w-4 mr-2" />
          Follow with notifications
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleFollow(false)}>
          <BellOff className="h-4 w-4 mr-2" />
          Follow without notifications
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
