import { supabase } from './client';
import type { Category, CategoryWithBooks } from '@/types/database';

// Obtener todas las categorías
export async function getAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('category_name', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }

  return data || [];
}

// Obtener categorías principales (sin parent)
export async function getMainCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .is('parent_category_id', null)
    .order('category_name', { ascending: true });

  if (error) {
    console.error('Error fetching main categories:', error);
    throw error;
  }

  return data || [];
}

// Obtener subcategorías de una categoría
export async function getSubcategories(parentId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('parent_category_id', parentId)
    .order('category_name', { ascending: true });

  if (error) {
    console.error('Error fetching subcategories:', error);
    throw error;
  }

  return data || [];
}

// Obtener categoría por ID
export async function getCategoryById(categoryId: string): Promise<CategoryWithBooks | null> {
  const { data, error } = await supabase
    .from('categories')
    .select(`
      *,
      parent_category:categories!parent_category_id(*),
      book_categories(
        book:books(*)
      )
    `)
    .eq('category_id', categoryId)
    .single();

  if (error) {
    console.error('Error fetching category:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    parent_category: data.parent_category || null,
    books: data.book_categories?.map((bc: any) => bc.book).filter(Boolean) || [],
    subcategories: [], // Se puede poblar después si es necesario
  };
}

