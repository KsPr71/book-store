import { supabase } from './client';
import type { Book } from '@/types/database';

/**
 * Crea un nuevo libro
 */
export async function createBook(bookData: {
  isbn?: string | null;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  publication_date?: string | null;
  publisher_id?: string | null;
  language: string;
  page_count?: number | null;
  file_size?: number | null;
  file_format?: string | null;
  cover_image_url?: string | null;
  sample_url?: string | null;
  full_content_url?: string | null;
  price: number;
  is_featured?: boolean;
  status: 'available' | 'draft' | 'out_of_stock';
}): Promise<{ data: Book | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('books')
      .insert([bookData])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating book:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al crear el libro';
    return { data: null, error: errorMessage };
  }
}

/**
 * Actualiza un libro existente
 */
export async function updateBook(
  bookId: string,
  bookData: Partial<Book>
): Promise<{ data: Book | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('books')
      .update(bookData)
      .eq('book_id', bookId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating book:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al actualizar el libro';
    return { data: null, error: errorMessage };
  }
}

/**
 * Elimina todas las asociaciones de autores de un libro
 */
export async function removeAllAuthorAssociations(
  bookId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('book_authors')
      .delete()
      .eq('book_id', bookId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error removing author associations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar asociaciones de autores';
    return { error: errorMessage };
  }
}

/**
 * Elimina todas las asociaciones de categorías de un libro
 */
export async function removeAllCategoryAssociations(
  bookId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('book_categories')
      .delete()
      .eq('book_id', bookId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error removing category associations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar asociaciones de categorías';
    return { error: errorMessage };
  }
}

/**
 * Asocia un autor con un libro
 */
export async function associateAuthorWithBook(
  bookId: string,
  authorId: string,
  role: 'main_author' | 'coauthor' | 'editor' = 'main_author'
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('book_authors')
      .insert([{
        book_id: bookId,
        author_id: authorId,
        role,
      }]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error associating author with book:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al asociar el autor con el libro';
    return { error: errorMessage };
  }
}

/**
 * Asocia una categoría con un libro
 */
export async function associateCategoryWithBook(
  bookId: string,
  categoryId: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase
      .from('book_categories')
      .insert([{
        book_id: bookId,
        category_id: categoryId,
      }]);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error associating category with book:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al asociar la categoría con el libro';
    return { error: errorMessage };
  }
}

/**
 * Elimina un libro y sus asociaciones
 */
export async function deleteBook(bookId: string): Promise<{ error: string | null }> {
  try {
    // Primero eliminar las asociaciones
    await supabase.from('book_authors').delete().eq('book_id', bookId);
    await supabase.from('book_categories').delete().eq('book_id', bookId);
    
    // Luego eliminar el libro
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('book_id', bookId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting book:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el libro';
    return { error: errorMessage };
  }
}

