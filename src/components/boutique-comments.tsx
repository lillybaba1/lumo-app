'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageCircle, Send, Loader2, MoreVertical, 
  Edit, Trash2, Reply, ChevronDown, ChevronUp 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
  getBoutiqueComments,
  addBoutiqueComment,
  editBoutiqueComment,
  deleteBoutiqueComment,
  BoutiqueComment,
} from '@/services/boutiqueSocialService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface BoutiqueCommentsProps {
  boutiqueId: string;
  isAuthenticated?: boolean;
  currentUserId?: string;
  className?: string;
}

export function BoutiqueComments({
  boutiqueId,
  isAuthenticated = false,
  currentUserId,
  className,
}: BoutiqueCommentsProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [comments, setComments] = useState<BoutiqueComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Load comments
  useEffect(() => {
    async function loadComments() {
      try {
        const data = await getBoutiqueComments(boutiqueId);
        setComments(data);
      } catch (error) {
        console.error('Error loading comments:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadComments();
  }, [boutiqueId]);

  const handleSubmitComment = async () => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to leave a comment.',
      });
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addBoutiqueComment(boutiqueId, newComment);
      if (result.success && result.comment) {
        setComments(prev => [result.comment!, ...prev]);
        setNewComment('');
        toast({ title: 'Comment added!', description: 'Your comment has been posted.' });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!isAuthenticated || !replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      const result = await addBoutiqueComment(boutiqueId, replyContent, parentId);
      if (result.success && result.comment) {
        // Add reply to parent comment
        setComments(prev => prev.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), result.comment!] };
          }
          return c;
        }));
        setReplyContent('');
        setReplyingTo(null);
        setExpandedReplies(prev => new Set([...prev, parentId]));
        toast({ title: 'Reply added!' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const result = await editBoutiqueComment(commentId, editContent);
      if (result.success) {
        // Update comment in state
        setComments(prev => prev.map(c => {
          if (c.id === commentId) {
            return { ...c, content: editContent, isEdited: true };
          }
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map(r => 
                r.id === commentId ? { ...r, content: editContent, isEdited: true } : r
              ),
            };
          }
          return c;
        }));
        setEditingId(null);
        setEditContent('');
        toast({ title: 'Comment updated!' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update comment', variant: 'destructive' });
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const result = await deleteBoutiqueComment(commentId);
      if (result.success) {
        setComments(prev => prev.filter(c => c.id !== commentId).map(c => ({
          ...c,
          replies: c.replies?.filter(r => r.id !== commentId),
        })));
        toast({ title: 'Comment deleted' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete comment', variant: 'destructive' });
    }
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const getInitials = (name?: string, email?: string) => {
    const str = name || email || 'U';
    return str.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
  };

  const renderComment = (comment: BoutiqueComment, isReply = false) => {
    const isOwn = currentUserId === comment.userId;
    const isEditing = editingId === comment.id;

    return (
      <div key={comment.id} className={cn("flex gap-3", isReply && "ml-12 mt-3")}>
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs bg-primary/10">
            {getInitials(comment.user?.name, comment.user?.email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">
              {comment.user?.name || 'Anonymous'}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {comment.isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleEditComment(comment.id)}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm mt-1 text-foreground/90">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-2 mt-2">
              {isAuthenticated && !isReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => {
                    setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    setReplyContent('');
                  }}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              
              {isOwn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => {
                      setEditingId(comment.id);
                      setEditContent(comment.content);
                    }}>
                      <Edit className="h-3 w-3 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )}

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="min-h-[60px] text-sm flex-1"
              />
              <Button
                size="sm"
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {/* Replies */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-muted-foreground"
                onClick={() => toggleReplies(comment.id)}
              >
                {expandedReplies.has(comment.id) ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
                  </>
                )}
              </Button>
              
              {expandedReplies.has(comment.id) && (
                <div className="space-y-3 mt-2">
                  {comment.replies.map(reply => renderComment(reply, true))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Comments
          {comments.length > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({comments.length})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New comment input */}
        <div className="flex gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="text-xs bg-primary/10">
              {isAuthenticated ? 'You' : '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <Textarea
              placeholder={isAuthenticated ? "Write a comment..." : "Sign in to leave a comment"}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              disabled={!isAuthenticated}
              className="min-h-[80px]"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitComment}
                disabled={isSubmitting || !newComment.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Post Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Comments list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
