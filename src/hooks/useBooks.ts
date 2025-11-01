import { useBookStore } from '@/contexts/BookStoreContext';
import { useMemo, useCallback } from 'react';
import type { Book, BookWithRelations } from '@/types/database';

/**
 * Hook para acceder a los libros y funciones relacionadas
 */
export function useBooks() {
  const {
    books,
    booksWithRelations,
    featuredBooks,
    loadingBooks,
    refreshBooks,
  } = useBookStore();

  // Libros disponibles (solo los que están en status 'available')
  const availableBooks = useMemo(() => {
    return books.filter((book) => book.status === 'available');
  }, [books]);

  // Libros disponibles con relaciones
  const availableBooksWithRelations = useMemo(() => {
    return booksWithRelations.filter((book) => book.status === 'available');
  }, [booksWithRelations]);

  // Obtener libro por ID desde el estado
  const getBookById = useCallback(
    (bookId: string): BookWithRelations | undefined => {
      return booksWithRelations.find((book) => book.book_id === bookId);
    },
    [booksWithRelations]
  );

  // Obtener libros por categoría
  const getBooksByCategory = useCallback(
    (categoryId: string): BookWithRelations[] => {
      return booksWithRelations.filter((book) =>
        book.categories?.some((cat) => cat.category_id === categoryId)
      );
    },
    [booksWithRelations]
  );

  // Obtener libros por autor
  const getBooksByAuthor = useCallback(
    (authorId: string): BookWithRelations[] => {
      return booksWithRelations.filter((book) =>
        book.authors?.some((author) => author.author_id === authorId)
      );
    },
    [booksWithRelations]
  );

  // Buscar libros
  const searchBooks = useCallback(
    (searchTerm: string): BookWithRelations[] => {
      const term = searchTerm.toLowerCase();
      return booksWithRelations.filter(
        (book) =>
          book.title.toLowerCase().includes(term) ||
          book.subtitle?.toLowerCase().includes(term) ||
          book.description?.toLowerCase().includes(term) ||
          book.isbn?.toLowerCase().includes(term)
      );
    },
    [booksWithRelations]
  );

  return {
    // Datos
    books,
    booksWithRelations,
    featuredBooks,
    availableBooks,
    availableBooksWithRelations,

    // Estados
    loading: loadingBooks,

    // Funciones
    refreshBooks,
    getBookById,
    getBooksByCategory,
    getBooksByAuthor,
    searchBooks,
  };
}

