'use client';

import { createClient } from '@/lib/supabase/client';

export interface BoutiqueComment {
  id: string;
  boutiqueId: string;
  userId: string;
  parentId?: string;
  content: string;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
  };
  replies?: BoutiqueComment[];
}

/**
 * Check if the current user is following a boutique
 */
export async function isFollowingBoutique(boutiqueId: string): Promise<{ following: boolean; notificationsEnabled: boolean }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { following: false, notificationsEnabled: false };

  const { data } = await supabase
    .from('boutique_followers')
    .select('id, notifications_enabled')
    .eq('boutique_id', boutiqueId)
    .eq('user_id', user.id)
    .single();

  return { 
    following: !!data, 
    notificationsEnabled: data?.notifications_enabled ?? true 
  };
}

/**
 * Follow a boutique
 */
export async function followBoutique(
  boutiqueId: string, 
  notificationsEnabled: boolean = true
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in to follow a boutique' };
  }

  const { error } = await supabase
    .from('boutique_followers')
    .insert({ 
      boutique_id: boutiqueId, 
      user_id: user.id,
      notifications_enabled: notificationsEnabled,
    });

  if (error) {
    if (error.code === '23505') {
      return { success: true }; // Already following
    }
    console.error('Error following boutique:', error);
    return { success: false, error: 'Failed to follow boutique' };
  }

  return { success: true };
}

/**
 * Toggle notifications for a followed boutique
 */
export async function toggleFollowNotifications(
  boutiqueId: string, 
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  const { error } = await supabase
    .from('boutique_followers')
    .update({ notifications_enabled: enabled })
    .eq('boutique_id', boutiqueId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error toggling notifications:', error);
    return { success: false, error: 'Failed to update notification settings' };
  }

  return { success: true };
}

/**
 * Unfollow a boutique
 */
export async function unfollowBoutique(boutiqueId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  const { error } = await supabase
    .from('boutique_followers')
    .delete()
    .eq('boutique_id', boutiqueId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unfollowing boutique:', error);
    return { success: false, error: 'Failed to unfollow boutique' };
  }

  return { success: true };
}

/**
 * Check if the current user has liked a boutique
 */
export async function hasLikedBoutique(boutiqueId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return false;

  const { data } = await supabase
    .from('boutique_likes')
    .select('id')
    .eq('boutique_id', boutiqueId)
    .eq('user_id', user.id)
    .single();

  return !!data;
}

/**
 * Like a boutique
 */
export async function likeBoutique(boutiqueId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in to like a boutique' };
  }

  const { error } = await supabase
    .from('boutique_likes')
    .insert({ boutique_id: boutiqueId, user_id: user.id });

  if (error) {
    if (error.code === '23505') {
      return { success: true }; // Already liked
    }
    console.error('Error liking boutique:', error);
    return { success: false, error: 'Failed to like boutique' };
  }

  return { success: true };
}

/**
 * Unlike a boutique
 */
export async function unlikeBoutique(boutiqueId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  const { error } = await supabase
    .from('boutique_likes')
    .delete()
    .eq('boutique_id', boutiqueId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unliking boutique:', error);
    return { success: false, error: 'Failed to unlike boutique' };
  }

  return { success: true };
}

/**
 * Get comments for a boutique
 */
export async function getBoutiqueComments(boutiqueId: string): Promise<BoutiqueComment[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('boutique_comments')
    .select(`
      id,
      boutique_id,
      user_id,
      parent_id,
      content,
      is_edited,
      created_at,
      updated_at,
      user_profiles:user_id (name)
    `)
    .eq('boutique_id', boutiqueId)
    .eq('is_hidden', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  // Map to our interface and organize into threads
  const comments: BoutiqueComment[] = (data || []).map((c: any) => ({
    id: c.id,
    boutiqueId: c.boutique_id,
    userId: c.user_id,
    parentId: c.parent_id,
    content: c.content,
    isEdited: c.is_edited,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    user: c.user_profiles ? { name: c.user_profiles.name || 'Anonymous', email: '' } : { name: 'Anonymous', email: '' },
    replies: [],
  }));

  // Organize into threads (parent comments with replies)
  const parentComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

  parentComments.forEach(parent => {
    parent.replies = replies.filter(r => r.parentId === parent.id);
  });

  return parentComments;
}

/**
 * Add a comment to a boutique
 */
export async function addBoutiqueComment(
  boutiqueId: string, 
  content: string, 
  parentId?: string
): Promise<{ success: boolean; comment?: BoutiqueComment; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in to comment' };
  }

  if (!content.trim()) {
    return { success: false, error: 'Comment cannot be empty' };
  }

  // First get the user's name from their profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  const { data, error } = await supabase
    .from('boutique_comments')
    .insert({ 
      boutique_id: boutiqueId, 
      user_id: user.id,
      parent_id: parentId || null,
      content: content.trim(),
    })
    .select(`
      id,
      boutique_id,
      user_id,
      parent_id,
      content,
      is_edited,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Failed to add comment' };
  }

  return { 
    success: true, 
    comment: {
      id: data.id,
      boutiqueId: data.boutique_id,
      userId: data.user_id,
      parentId: data.parent_id,
      content: data.content,
      isEdited: data.is_edited,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      user: { name: profile?.name || 'Anonymous', email: '' },
      replies: [],
    }
  };
}

/**
 * Edit a comment
 */
export async function editBoutiqueComment(
  commentId: string, 
  content: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  if (!content.trim()) {
    return { success: false, error: 'Comment cannot be empty' };
  }

  const { error } = await supabase
    .from('boutique_comments')
    .update({ 
      content: content.trim(),
      is_edited: true,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error editing comment:', error);
    return { success: false, error: 'Failed to edit comment' };
  }

  return { success: true };
}

/**
 * Delete a comment
 */
export async function deleteBoutiqueComment(commentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { success: false, error: 'You must be logged in' };
  }

  const { error } = await supabase
    .from('boutique_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting comment:', error);
    return { success: false, error: 'Failed to delete comment' };
  }

  return { success: true };
}

/**
 * Get social stats for a boutique (for initial load)
 */
export async function getBoutiqueSocialStats(boutiqueId: string): Promise<{
  followerCount: number;
  likeCount: number;
  commentCount: number;
  isFollowing: boolean;
  notificationsEnabled: boolean;
  hasLiked: boolean;
}> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get counts from boutique
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('follower_count, like_count, comment_count')
    .eq('id', boutiqueId)
    .single();

  let isFollowing = false;
  let notificationsEnabled = true;
  let hasLiked = false;

  if (user) {
    // Check if user is following and their notification preference
    const { data: followData } = await supabase
      .from('boutique_followers')
      .select('id, notifications_enabled')
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id)
      .single();
    isFollowing = !!followData;
    notificationsEnabled = followData?.notifications_enabled ?? true;

    // Check if user has liked
    const { data: likeData } = await supabase
      .from('boutique_likes')
      .select('id')
      .eq('boutique_id', boutiqueId)
      .eq('user_id', user.id)
      .single();
    hasLiked = !!likeData;
  }

  return {
    followerCount: boutique?.follower_count || 0,
    likeCount: boutique?.like_count || 0,
    commentCount: boutique?.comment_count || 0,
    isFollowing,
    notificationsEnabled,
    hasLiked,
  };
}
