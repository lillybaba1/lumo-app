"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save, Loader2, Plus, Edit, Trash2, GripVertical, HelpCircle } from 'lucide-react';
import { getFAQData, saveFAQData } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FAQ, FAQData } from '@/lib/types';

export default function FAQAdminPage() {
  const { toast } = useToast();
  const [faqData, setFaqData] = useState<FAQData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<FAQ | null>(null);
  const [isNewFAQ, setIsNewFAQ] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await getFAQData();
      setFaqData(data || {
        title: 'Frequently Asked Questions',
        introText: '',
        faqs: []
      });
    } catch (error) {
      console.error('Failed to load FAQ data:', error);
      setFaqData({
        title: 'Frequently Asked Questions',
        introText: '',
        faqs: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!faqData) return;
    setIsSaving(true);
    try {
      await saveFAQData(faqData);
      toast({
        title: "FAQ Updated",
        description: "Your FAQ content has been saved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save FAQ data.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNew = () => {
    const newFAQ: FAQ = {
      id: Date.now().toString(),
      question: '',
      answer: '',
      displayOrder: faqData?.faqs.length || 0,
      createdAt: new Date().toISOString()
    };
    setEditingFAQ(newFAQ);
    setIsNewFAQ(true);
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFAQ(faq);
    setIsNewFAQ(false);
  };

  const handleSaveFAQ = () => {
    if (!editingFAQ || !faqData) return;

    if (!editingFAQ.question.trim() || !editingFAQ.answer.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in both question and answer.",
        variant: "destructive"
      });
      return;
    }

    if (isNewFAQ) {
      setFaqData({
        ...faqData,
        faqs: [...faqData.faqs, { ...editingFAQ, updatedAt: new Date().toISOString() }]
      });
    } else {
      setFaqData({
        ...faqData,
        faqs: faqData.faqs.map(f =>
          f.id === editingFAQ.id
            ? { ...editingFAQ, updatedAt: new Date().toISOString() }
            : f
        )
      });
    }

    setEditingFAQ(null);
  };

  const handleDelete = (id: string) => {
    if (!faqData) return;
    setFaqData({
      ...faqData,
      faqs: faqData.faqs.filter(f => f.id !== id)
    });
    setDeleteConfirm(null);
  };

  const moveUp = (index: number) => {
    if (!faqData || index === 0) return;
    const newFaqs = [...faqData.faqs];
    [newFaqs[index - 1], newFaqs[index]] = [newFaqs[index], newFaqs[index - 1]];
    newFaqs.forEach((f, i) => f.displayOrder = i);
    setFaqData({ ...faqData, faqs: newFaqs });
  };

  const moveDown = (index: number) => {
    if (!faqData || index === faqData.faqs.length - 1) return;
    const newFaqs = [...faqData.faqs];
    [newFaqs[index], newFaqs[index + 1]] = [newFaqs[index + 1], newFaqs[index]];
    newFaqs.forEach((f, i) => f.displayOrder = i);
    setFaqData({ ...faqData, faqs: newFaqs });
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold">Manage FAQ</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage FAQ</h1>
          <p className="text-muted-foreground mt-1">
            Manage your Help Center frequently asked questions
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Page Settings</CardTitle>
            <CardDescription>Configure the title and introduction for your FAQ page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Page Title</Label>
              <Input
                id="title"
                value={faqData?.title || ''}
                onChange={(e) => setFaqData(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="Frequently Asked Questions"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="intro">Introduction Text (Optional)</Label>
              <Textarea
                id="intro"
                value={faqData?.introText || ''}
                onChange={(e) => setFaqData(prev => prev ? { ...prev, introText: e.target.value } : null)}
                placeholder="Welcome to our Help Center. Find answers to common questions below."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5" />
                  FAQ Items ({faqData?.faqs.length || 0})
                </CardTitle>
                <CardDescription>Add, edit, and manage your FAQ entries</CardDescription>
              </div>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!faqData?.faqs.length ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground mb-4">No FAQ items yet</p>
                <Button onClick={handleCreateNew} variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First FAQ
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {faqData.faqs.map((faq, index) => (
                  <div key={faq.id} className="flex items-start gap-3 p-4 border rounded-lg">
                    <div className="flex flex-col gap-1 pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="h-6 w-6 p-0"
                      >
                        ↑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveDown(index)}
                        disabled={index === faqData.faqs.length - 1}
                        className="h-6 w-6 p-0"
                      >
                        ↓
                      </Button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm mb-1">{faq.question}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(faq)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Dialog open={deleteConfirm === faq.id} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(faq.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Delete FAQ?</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to delete this FAQ item? This action cannot be undone.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                              Cancel
                            </Button>
                            <Button variant="destructive" onClick={() => handleDelete(faq.id)}>
                              Delete
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit/Create FAQ Dialog */}
      <Dialog open={!!editingFAQ} onOpenChange={(open) => !open && setEditingFAQ(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isNewFAQ ? 'Add New FAQ' : 'Edit FAQ'}
            </DialogTitle>
            <DialogDescription>
              {isNewFAQ ? 'Create a new frequently asked question' : 'Update this FAQ item'}
            </DialogDescription>
          </DialogHeader>
          {editingFAQ && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Input
                  id="question"
                  placeholder="How do I return an item?"
                  value={editingFAQ.question}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="answer">Answer *</Label>
                <Textarea
                  id="answer"
                  placeholder="You can return items within 30 days of purchase..."
                  value={editingFAQ.answer}
                  onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                  rows={6}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFAQ(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveFAQ}>
              {isNewFAQ ? 'Add FAQ' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
