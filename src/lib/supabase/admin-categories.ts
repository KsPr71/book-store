import { supabase } from './client';
import type { Category } from '@/types/database';

/**
 * Crea una nueva categoría
 */
export async function createCategory(categoryData: {
  category_name: string;
  parent_category_id?: string | null;
  description?: string | null;
}): Promise<{ data: Category | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating category:', error);
    return { data: null, error: error.message || 'Error al crear la categoría' };
  }
}

/**
 * Actualiza una categoría existente
 */
export async function updateCategory(
  categoryId: string,
  categoryData: Partial<Category>
): Promise<{ data: Category | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('category_id', categoryId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating category:', error);
    return { data: null, error: error.message || 'Error al actualizar la categoría' };
  }
}

