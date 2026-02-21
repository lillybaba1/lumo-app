"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { getPages, savePage, deletePage } from './actions';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type PageContent = {
  title: string;
  content: string;
  updatedAt?: string;
};

type Pages = {
  [key: string]: PageContent;
};

export default function PagesPage() {
  const { toast } = useToast();
  const [pages, setPages] = useState<Pages | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<{ slug: string; data: PageContent } | null>(null);
  const [isNewPage, setIsNewPage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadPages = async () => {
    try {
      const data = await getPages();
      console.log('Loaded pages:', data);
      setPages(data || {});
    } catch (error) {
      console.error('Failed to load pages:', error);
      setPages({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  const handleEditPage = (slug: string) => {
    if (pages && pages[slug]) {
      setEditingPage({ slug, data: pages[slug] });
      setIsNewPage(false);
    }
  };

  const handleCreateNew = () => {
    setEditingPage({
      slug: '',
      data: { title: '', content: '', updatedAt: new Date().toISOString() }
    });
    setIsNewPage(true);
  };

  const handleSavePage = async () => {
    if (!editingPage) return;

    const slug = isNewPage ? editingPage.slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : editingPage.slug;

    if (!slug || !editingPage.data.title || !editingPage.data.content) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await savePage(slug, editingPage.data);
      await loadPages();
      setEditingPage(null);
      toast({
        title: "Page Saved",
        description: `Successfully ${isNewPage ? 'created' : 'updated'} the page.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save page.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePage = async (slug: string) => {
    try {
      await deletePage(slug);
      await loadPages();
      setDeleteConfirm(null);
      toast({
        title: "Page Deleted",
        description: "The page has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete page.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-headline font-bold">Manage Pages</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageEntries = pages ? Object.entries(pages) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Manage Pages</h1>
          <p className="text-muted-foreground mt-1">
            Create and edit static pages for your store
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Page
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Pages ({pageEntries.length})</CardTitle>
          <CardDescription>
            Manage your store&apos;s static content pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pageEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No pages created yet</p>
              <Button onClick={handleCreateNew} variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Page
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page Title</TableHead>
                  <TableHead>Slug / Route</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageEntries.map(([slug, page]) => (
                  <TableRow key={slug}>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          /pages/{slug}
                        </code>
                        <Link href={`/pages/${slug}`} target="_blank">
                          <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      {page.updatedAt
                        ? new Date(page.updatedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditPage(slug)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Dialog open={deleteConfirm === slug} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteConfirm(slug)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Delete Page?</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to delete &ldquo;{page.title}&rdquo;? This action cannot be undone.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                              </Button>
                              <Button variant="destructive" onClick={() => handleDeletePage(slug)}>
                                Delete Page
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit/Create Dialog */}
      <Dialog open={!!editingPage} onOpenChange={(open) => !open && setEditingPage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isNewPage ? 'Create New Page' : `Edit: ${editingPage?.data.title}`}
            </DialogTitle>
            <DialogDescription>
              {isNewPage
                ? 'Create a new static page for your store'
                : 'Update the content for this page'
              }
            </DialogDescription>
          </DialogHeader>
          {editingPage && (
            <div className="space-y-4 py-4">
              {isNewPage && (
                <div className="space-y-2">
                  <Label htmlFor="slug">Page Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="about-us"
                    value={editingPage.slug}
                    onChange={(e) => setEditingPage({
                      ...editingPage,
                      slug: e.target.value
                    })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Will be available at: /pages/{editingPage.slug || 'slug'}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  placeholder="About Us"
                  value={editingPage.data.title}
                  onChange={(e) => setEditingPage({
                    ...editingPage,
                    data: { ...editingPage.data, title: e.target.value }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Page Content *</Label>
                <Textarea
                  id="content"
                  placeholder="Enter your page content here..."
                  value={editingPage.data.content}
                  onChange={(e) => setEditingPage({
                    ...editingPage,
                    data: { ...editingPage.data, content: e.target.value }
                  })}
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Supports plain text and line breaks
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPage(null)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSavePage} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : (isNewPage ? 'Create Page' : 'Save Changes')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
