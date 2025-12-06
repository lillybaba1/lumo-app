'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Zap, Plus, Edit2, Trash2 } from 'lucide-react';
import { getQuickReplies, createQuickReply, updateQuickReply, deleteQuickReply } from './actions';
import { useToast } from '@/hooks/use-toast';

interface QuickReply {
  id: string;
  title: string;
  content: string;
  category?: string;
}

export function QuickRepliesDialog() {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [replies, setReplies] = useState<QuickReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingReply, setEditingReply] = useState<QuickReply | null>(null);
  const [formData, setFormData] = useState({ title: '', content: '', category: '' });

  useEffect(() => {
    if (open) {
      loadReplies();
    }
  }, [open]);

  async function loadReplies() {
    setLoading(true);
    const result = await getQuickReplies();
    if (result.success) {
      setReplies(result.data || []);
    }
    setLoading(false);
  }

  function resetForm() {
    setFormData({ title: '', content: '', category: '' });
    setEditingReply(null);
  }

  function handleEdit(reply: QuickReply) {
    setEditingReply(reply);
    setFormData({
      title: reply.title,
      content: reply.content,
      category: reply.category || '',
    });
  }

  async function handleSubmit() {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    if (editingReply) {
      const result = await updateQuickReply(editingReply.id, formData);
      if (result.success) {
        toast({ title: 'Quick reply updated' });
        loadReplies();
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } else {
      const result = await createQuickReply(formData);
      if (result.success) {
        toast({ title: 'Quick reply created' });
        loadReplies();
        resetForm();
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    }
    
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this quick reply?')) return;

    const result = await deleteQuickReply(id);
    if (result.success) {
      toast({ title: 'Quick reply deleted' });
      loadReplies();
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Quick Replies">
          <Zap className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Replies</DialogTitle>
          <DialogDescription>
            Create templates for common responses to save time when messaging customers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Form */}
          <div className="border rounded-lg p-4 space-y-4">
            <h4 className="font-medium">
              {editingReply ? 'Edit Quick Reply' : 'Add New Quick Reply'}
            </h4>
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Shipping Info"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    placeholder="e.g., shipping, returns"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Message *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your quick reply message..."
                  rows={3}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {editingReply ? 'Update' : 'Add'} Quick Reply
                </Button>
                {editingReply && (
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* List */}
          <div className="space-y-2">
            <h4 className="font-medium">Your Quick Replies</h4>
            {replies.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No quick replies yet. Create one above to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="flex items-start justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{reply.title}</span>
                        {reply.category && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded">
                            {reply.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {reply.content}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reply)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reply.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
