import { supabase } from './client';
import type { Author } from '@/types/database';

/**
 * Crea un nuevo autor
 */
export async function createAuthor(authorData: {
  full_name: string;
  biography?: string | null;
  photo_url?: string | null;
  birth_date?: string | null;
  nationality?: string | null;
  website?: string | null;
}): Promise<{ data: Author | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('authors')
      .insert([authorData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error creating author:', error);
    return { data: null, error: error.message || 'Error al crear el autor' };
  }
}

/**
 * Actualiza un autor existente
 */
export async function updateAuthor(
  authorId: string,
  authorData: Partial<Author>
): Promise<{ data: Author | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('authors')
      .update(authorData)
      .eq('author_id', authorId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating author:', error);
    return { data: null, error: error.message || 'Error al actualizar el autor' };
  }
}

