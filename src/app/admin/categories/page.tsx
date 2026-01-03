'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, FolderOpen, Upload, X } from 'lucide-react';
import { getCategories } from '@/services/productService';
import { addCategory, updateCategory, deleteCategory } from '@/services/categoryService';
import { useToast } from '@/hooks/use-toast';
import type { Category } from '@/lib/types';

// Common emoji icons for categories
const CATEGORY_ICONS = [
  '🛍️', '👗', '💄', '🏠', '📱', '🍽️', '💊', '⚽', '🧸', '📚', 
  '🎨', '💎', '🎮', '🌱', '🚗', '🎵', '🐕', '💼', '✈️', '👟',
  '🧴', '🍕', '☕', '🎁', '🔧', '💻', '📷', '🎧', '⌚', '👜'
];

// Default colors - Modern Premium v2.0
const DEFAULT_BG_COLOR = '#f3f4f6';
const DEFAULT_TEXT_COLOR = '#1e293b';
const DEFAULT_ICON_BG = '#4F46E5';

interface FormData {
  name: string;
  description: string;
  image: string;
  icon: string;
  bgColor: string;
  textColor: string;
  iconBgColor: string;
}

const defaultFormData: FormData = {
  name: '',
  description: '',
  image: '',
  icon: '🛍️',
  bgColor: DEFAULT_BG_COLOR,
  textColor: DEFAULT_TEXT_COLOR,
  iconBgColor: DEFAULT_ICON_BG,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load categories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleAdd() {
    setEditingCategory(null);
    setFormData(defaultFormData);
    setDialogOpen(true);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      image: category.image || '',
      icon: category.icon || '🛍️',
      bgColor: category.bgColor || DEFAULT_BG_COLOR,
      textColor: category.textColor || DEFAULT_TEXT_COLOR,
      iconBgColor: category.iconBgColor || DEFAULT_ICON_BG,
    });
    setDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'categories');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setFormData(prev => ({ ...prev, image: data.url }));
      
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Could not upload image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  function handleDeleteClick(category: Category) {
    setDeletingCategory(category);
    setDeleteDialogOpen(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Category name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      if (editingCategory) {
        await updateCategory({
          ...editingCategory,
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image,
          icon: formData.icon,
          bgColor: formData.bgColor,
          textColor: formData.textColor,
          iconBgColor: formData.iconBgColor,
        });
        toast({
          title: 'Success',
          description: 'Category updated successfully',
        });
      } else {
        await addCategory({
          name: formData.name.trim(),
          description: formData.description.trim(),
          image: formData.image,
          icon: formData.icon,
          bgColor: formData.bgColor,
          textColor: formData.textColor,
          iconBgColor: formData.iconBgColor,
        });
        toast({
          title: 'Success',
          description: 'Category created successfully',
        });
      }

      setDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save category',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deletingCategory) return;

    try {
      setSaving(true);
      await deleteCategory(deletingCategory.id);
      toast({
        title: 'Success',
        description: 'Category deleted successfully',
      });
      setDeleteDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-headline font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">All Categories</CardTitle>
          <CardDescription>
            {categories.length} {categories.length === 1 ? 'category' : 'categories'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpen className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-semibold mb-2">No categories yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first product category
              </p>
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Preview</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell>
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: category.iconBgColor || DEFAULT_ICON_BG }}
                      >
                        {category.image ? (
                          <Image 
                            src={category.image} 
                            alt={category.name} 
                            width={48} 
                            height={48} 
                            className="w-full h-full object-cover rounded-lg"
                            unoptimized
                          />
                        ) : (
                          <span className="text-2xl">{category.icon || '🛍️'}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                      {category.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <div 
                          className="w-6 h-6 rounded border" 
                          style={{ backgroundColor: category.bgColor || DEFAULT_BG_COLOR }}
                          title="Background"
                        />
                        <div 
                          className="w-6 h-6 rounded border" 
                          style={{ backgroundColor: category.iconBgColor || DEFAULT_ICON_BG }}
                          title="Icon Background"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(category)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(category)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Update the category details below'
                : 'Create a new product category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Preview */}
            <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: formData.bgColor }}>
              <div 
                className="w-16 h-16 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: formData.iconBgColor }}
              >
                {formData.image ? (
                  <Image 
                    src={formData.image} 
                    alt="Preview" 
                    width={64} 
                    height={64} 
                    className="w-full h-full object-cover rounded-xl"
                    unoptimized
                  />
                ) : (
                  <span className="text-3xl">{formData.icon}</span>
                )}
              </div>
              <div>
                <p className="font-medium" style={{ color: formData.textColor }}>
                  {formData.name || 'Category Name'}
                </p>
                <p className="text-sm opacity-70" style={{ color: formData.textColor }}>
                  {formData.description || 'Category description'}
                </p>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Electronics, Fashion"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Category Image</Label>
              <div className="flex items-center gap-4">
                {formData.image ? (
                  <div className="relative">
                    <Image 
                      src={formData.image} 
                      alt="Category" 
                      width={80} 
                      height={80} 
                      className="w-20 h-20 object-cover rounded-lg border"
                      unoptimized
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setFormData({ ...formData, image: '' })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="w-20 h-20 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <div className="text-sm text-muted-foreground">
                  <p>Upload an image for this category</p>
                  <p className="text-xs">PNG, JPG up to 5MB</p>
                </div>
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-2">
              <Label>Icon (used if no image)</Label>
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-muted transition-colors ${
                      formData.icon === icon ? 'ring-2 ring-primary bg-primary/10' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, icon })}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bgColor">Background Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="bgColor"
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.bgColor}
                    onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                    placeholder="#f3f4f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="textColor"
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.textColor}
                    onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                    placeholder="#1f2937"
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="iconBgColor">Icon Background</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="iconBgColor"
                    value={formData.iconBgColor}
                    onChange={(e) => setFormData({ ...formData, iconBgColor: e.target.value })}
                    className="w-12 h-10 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.iconBgColor}
                    onChange={(e) => setFormData({ ...formData, iconBgColor: e.target.value })}
                    placeholder="#4F46E5"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving || uploading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCategory?.name}"? This action cannot be
              undone. Products in this category will not be deleted but will need to be
              re-categorized.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
