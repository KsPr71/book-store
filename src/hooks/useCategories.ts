import { useBookStore } from '@/contexts/BookStoreContext';
import { useMemo, useCallback } from 'react';
import type { Category } from '@/types/database';

/**
 * Hook para acceder a las categorías y funciones relacionadas
 */
export function useCategories() {
  const {
    categories,
    mainCategories,
    loadingCategories,
    refreshCategories,
  } = useBookStore();

  // Obtener subcategorías de una categoría principal
  const getSubcategories = useCallback(
    (parentId: string): Category[] => {
      return categories.filter((cat) => cat.parent_category_id === parentId);
    },
    [categories]
  );

  // Obtener categoría por ID
  const getCategoryById = useCallback(
    (categoryId: string): Category | undefined => {
      return categories.find((cat) => cat.category_id === categoryId);
    },
    [categories]
  );

  // Obtener categoría padre
  const getParentCategory = useCallback(
    (category: Category): Category | undefined => {
      if (!category.parent_category_id) return undefined;
      return categories.find((cat) => cat.category_id === category.parent_category_id);
    },
    [categories]
  );

  // Buscar categorías
  const searchCategories = useCallback(
    (searchTerm: string): Category[] => {
      const term = searchTerm.toLowerCase();
      return categories.filter(
        (cat) =>
          cat.category_name.toLowerCase().includes(term) ||
          cat.description?.toLowerCase().includes(term)
      );
    },
    [categories]
  );

  // Estructura jerárquica de categorías (categorías principales con sus subcategorías)
  const hierarchicalCategories = useMemo(() => {
    return mainCategories.map((mainCat) => ({
      ...mainCat,
      subcategories: getSubcategories(mainCat.category_id),
    }));
  }, [mainCategories, getSubcategories]);

  return {
    // Datos
    categories,
    mainCategories,
    hierarchicalCategories,

    // Estados
    loading: loadingCategories,

    // Funciones
    refreshCategories,
    getSubcategories,
    getCategoryById,
    getParentCategory,
    searchCategories,
  };
}

