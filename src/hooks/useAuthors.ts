import { useBookStore } from '@/contexts/BookStoreContext';
import { useMemo, useCallback } from 'react';
import type { Author } from '@/types/database';

/**
 * Hook para acceder a los autores y funciones relacionadas
 */
export function useAuthors() {
  const { authors, loadingAuthors, refreshAuthors } = useBookStore();

  // Buscar autores
  const searchAuthors = useCallback(
    (searchTerm: string): Author[] => {
      const term = searchTerm.toLowerCase();
      return authors.filter((author) =>
        author.full_name.toLowerCase().includes(term) ||
        author.biography?.toLowerCase().includes(term) ||
        author.nationality?.toLowerCase().includes(term)
      );
    },
    [authors]
  );

  // Obtener autor por ID
  const getAuthorById = useCallback(
    (authorId: string): Author | undefined => {
      return authors.find((author) => author.author_id === authorId);
    },
    [authors]
  );

  // Obtener autores ordenados por nombre
  const sortedAuthors = useMemo(() => {
    return [...authors].sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [authors]);

  return {
    // Datos
    authors,
    sortedAuthors,

    // Estados
    loading: loadingAuthors,

    // Funciones
    refreshAuthors,
    searchAuthors,
    getAuthorById,
  };
}

