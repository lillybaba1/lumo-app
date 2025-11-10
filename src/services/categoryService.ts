"use server";

import { Category } from '@/lib/types';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { categories as mockCategories } from '@/lib/mock-data';

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
        description: null,
        image_url: null,
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
    };
  } catch (error) {
    console.error('Failed to add category:', error);
    throw new Error('Could not save category.');
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
      })
      .eq('id', category.id);

    if (error) {
      console.error(`Failed to update category ${category.id}:`, error);
      throw new Error('Could not update category.');
    }
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
    }));
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return mockCategories;
  }
}
