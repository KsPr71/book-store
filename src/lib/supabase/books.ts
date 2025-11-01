import { supabase } from './client';
import type { Book, BookWithRelations, Author, Category, Publisher } from '@/types/database';

// Obtener todos los libros
export async function getAllBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books:', error);
    throw error;
  }

  return data || [];
}

// Obtener libros con todas las relaciones (autores, categorías, editor)
export async function getBooksWithRelations(): Promise<BookWithRelations[]> {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      publisher:publishers(*),
      book_authors(
        role,
        author:authors(*)
      ),
      book_categories(
        category:categories(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching books with relations:', error);
    throw error;
  }

  // Transformar los datos para tener una estructura más limpia
  return (data || []).map((book: any) => ({
    ...book,
    authors: book.book_authors?.map((ba: any) => ({
      ...ba.author,
      role: ba.role,
    })) || [],
    categories: book.book_categories?.map((bc: any) => bc.category) || [],
  }));
}

// Obtener libro por ID
export async function getBookById(bookId: string): Promise<BookWithRelations | null> {
  const { data, error } = await supabase
    .from('books')
    .select(`
      *,
      publisher:publishers(*),
      book_authors(
        role,
        author:authors(*)
      ),
      book_categories(
        category:categories(*)
      )
    `)
    .eq('book_id', bookId)
    .single();

  if (error) {
    console.error('Error fetching book:', error);
    return null;
  }

  if (!data) return null;

  return {
    ...data,
    authors: data.book_authors?.map((ba: any) => ({
      ...ba.author,
      role: ba.role,
    })) || [],
    categories: data.book_categories?.map((bc: any) => bc.category) || [],
  };
}

// Obtener libros destacados
export async function getFeaturedBooks(): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('is_featured', true)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching featured books:', error);
    throw error;
  }

  return data || [];
}

// Obtener libros por categoría
export async function getBooksByCategory(categoryId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('book_categories')
    .select(`
      book:books(*)
    `)
    .eq('category_id', categoryId);

  if (error) {
    console.error('Error fetching books by category:', error);
    throw error;
  }

  return data?.map((item: any) => item.book).filter(Boolean) || [];
}

// Obtener libros por autor
export async function getBooksByAuthor(authorId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('book_authors')
    .select(`
      book:books(*)
    `)
    .eq('author_id', authorId);

  if (error) {
    console.error('Error fetching books by author:', error);
    throw error;
  }

  return data?.map((item: any) => item.book).filter(Boolean) || [];
}

// Buscar libros por término
export async function searchBooks(searchTerm: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,isbn.ilike.%${searchTerm}%`)
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error searching books:', error);
    throw error;
  }

  return data || [];
}

