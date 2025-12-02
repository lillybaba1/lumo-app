"use server";

import { Category } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { categories as mockCategories } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

/**
 * Add a new category
 */
export async function addCategory(category: Omit<Category, 'id'>): Promise<Category> {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description || null,
        image_url: category.image || null,
        icon: category.icon || null,
        bg_color: category.bgColor || null,
        text_color: category.textColor || null,
        icon_bg_color: category.iconBgColor || null,
        parent_id: null,
        display_order: 0,
        is_active: true,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('Failed to add category:', error);
      throw new Error('Could not save category.');
    }

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      image: data.image_url,
      icon: data.icon,
      bgColor: data.bg_color,
      textColor: data.text_color,
      iconBgColor: data.icon_bg_color,
    };
  } catch (error) {
    console.error('Failed to add category:', error);
    throw new Error('Could not save category.');
  } finally {
    // Revalidate all pages that show categories
    revalidatePath('/', 'layout');
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(category: Category): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('categories')
      .update({
        name: category.name,
        slug: category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description || null,
        image_url: category.image || null,
        icon: category.icon || null,
        bg_color: category.bgColor || null,
        text_color: category.textColor || null,
        icon_bg_color: category.iconBgColor || null,
      })
      .eq('id', category.id);

    if (error) {
      console.error(`Failed to update category ${category.id}:`, error);
      throw new Error('Could not update category.');
    }

    // Revalidate all pages that show categories
    revalidatePath('/', 'layout');
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
  } catch (error) {
    console.error(`Failed to update category ${category.id}:`, error);
    throw new Error('Could not update category.');
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`Failed to delete category ${id}:`, error);
      throw new Error('Could not delete category.');
    }

    // Revalidate all pages that show categories
    revalidatePath('/', 'layout');
    revalidatePath('/admin/categories');
    revalidatePath('/categories');
  } catch (error) {
    console.error(`Failed to delete category ${id}:`, error);
    throw new Error('Could not delete category.');
  }
}

/**
 * Get all categories
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Failed to fetch categories from Supabase:', error);
      return mockCategories;
    }

    if (!data || data.length === 0) {
      return mockCategories;
    }

    return data.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      image: cat.image_url,
      icon: cat.icon,
      bgColor: cat.bg_color,
      textColor: cat.text_color,
      iconBgColor: cat.icon_bg_color,
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return mockCategories;
  }
}
