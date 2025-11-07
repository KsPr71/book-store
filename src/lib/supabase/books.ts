import { supabase } from './client';
import type { Book, BookWithRelations, Author, Category, AuthorRole } from '@/types/database';

// Tipos para la respuesta de Supabase con relaciones anidadas
interface SupabaseBookAuthor {
  role: AuthorRole;
  author: Author;
}

interface SupabaseBookCategory {
  category: Category;
}

interface SupabaseBookResponse extends Book {
  book_authors?: SupabaseBookAuthor[];
  book_categories?: SupabaseBookCategory[];
}

// Helper para agregar timeout a las promesas (funciona con objetos thenable como Supabase)
type Thenable<T> = { then: (onfulfilled?: (value: T) => unknown) => unknown };
function withTimeout<T>(promise: Promise<T> | Thenable<T>, timeoutMs: number = 30000): Promise<T> {
  const actualPromise = Promise.resolve(promise);
  return Promise.race([
    actualPromise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
}

// Obtener todos los libros
export async function getAllBooks(): Promise<Book[]> {
  try {
    const queryPromise = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    const result = await withTimeout(queryPromise, 30000);
    const { data, error } = result as { data: Book[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching books:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Timeout or error fetching books:', error);
    // Retornar array vacío en caso de timeout para no romper la UI
    return [];
  }
}

// Obtener libros con todas las relaciones (autores, categorías, editor)
export async function getBooksWithRelations(): Promise<BookWithRelations[]> {
  try {
    const queryPromise = supabase
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

    const result = await withTimeout(queryPromise, 30000);
    const { data, error } = result as { data: SupabaseBookResponse[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching books with relations:', error);
      throw error;
    }

    // Transformar los datos para tener una estructura más limpia
    return (data || []).map((book: SupabaseBookResponse): BookWithRelations => ({
      ...book,
      authors: book.book_authors?.map((ba: SupabaseBookAuthor) => ({
        ...ba.author,
        role: ba.role,
      })) || [],
      categories: book.book_categories?.map((bc: SupabaseBookCategory) => bc.category) || [],
    }));
  } catch (error) {
    console.error('Timeout or error fetching books with relations:', error);
    // Retornar array vacío en caso de timeout para no romper la UI
    return [];
  }
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

  const bookData = data as SupabaseBookResponse;

  return {
    ...bookData,
    authors: bookData.book_authors?.map((ba: SupabaseBookAuthor) => ({
      ...ba.author,
      role: ba.role,
    })) || [],
    categories: bookData.book_categories?.map((bc: SupabaseBookCategory) => bc.category) || [],
  };
}

// Obtener libros destacados
export async function getFeaturedBooks(): Promise<Book[]> {
  try {
    const queryPromise = supabase
      .from('books')
      .select('*')
      .eq('is_featured', true)
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    const result = await withTimeout(queryPromise, 30000);
    const { data, error } = result as { data: Book[] | null; error: Error | null };

    if (error) {
      console.error('Error fetching featured books:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Timeout or error fetching featured books:', error);
    return [];
  }
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

  interface BookCategoryItem {
    book: Book | null;
  }
  return ((data as unknown) as BookCategoryItem[] | null)?.map((item) => item.book).filter((book): book is Book => Boolean(book)) || [];
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

  interface BookAuthorItem {
    book: Book | null;
  }
  return ((data as unknown) as BookAuthorItem[] | null)?.map((item) => item.book).filter((book): book is Book => Boolean(book)) || [];
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

