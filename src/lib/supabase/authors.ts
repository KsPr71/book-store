import { supabase } from './client';
import type { Author, Book } from '@/types/database';

// Obtener todos los autores
export async function getAllAuthors(): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching authors:', error);
    throw error;
  }

  return data || [];
}

// Obtener autor por ID
export async function getAuthorById(authorId: string): Promise<Author | null> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .eq('author_id', authorId)
    .single();

  if (error) {
    console.error('Error fetching author:', error);
    return null;
  }

  return data;
}

// Obtener autor con sus libros
export async function getAuthorWithBooks(authorId: string) {
  const { data, error } = await supabase
    .from('authors')
    .select(`
      *,
      book_authors(
        role,
        book:books(*)
      )
    `)
    .eq('author_id', authorId)
    .single();

  if (error) {
    console.error('Error fetching author with books:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    books: data.book_authors?.map((ba: any) => ba.book).filter(Boolean) || [],
  };
}

// Buscar autores por nombre
export async function searchAuthors(searchTerm: string): Promise<Author[]> {
  const { data, error } = await supabase
    .from('authors')
    .select('*')
    .ilike('full_name', `%${searchTerm}%`)
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error searching authors:', error);
    throw error;
  }

  return data || [];
}

