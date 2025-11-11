'use client';

import * as React from 'react';
import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialIcon from '@mui/material/SpeedDialIcon';
import SpeedDialAction from '@mui/material/SpeedDialAction';
import { Search, User, Calendar, ArrowUpAZ, Users, X, Tag } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { motion, AnimatePresence } from 'motion/react';

export type SearchFilterType = 'name' | 'author' | 'year' | null;
export type SortType = 'alphabetical' | 'author' | null;

interface BookSpeedDialProps {
  onSearchBy?: (type: SearchFilterType) => void;
  onSortBy?: (type: SortType) => void;
  onFilterByCategory?: (categoryId: string | null) => void;
  currentSearchFilter?: SearchFilterType;
  currentSort?: SortType;
  currentCategoryId?: string | null;
}

export default function BookSpeedDial({
  onSearchBy,
  onSortBy,
  onFilterByCategory,
  currentSearchFilter,
  currentSort,
  currentCategoryId,
}: BookSpeedDialProps) {
  const [open, setOpen] = React.useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = React.useState(false);
  const { mainCategories, loading: loadingCategories } = useCategories();

  const searchActions = [
    { 
      icon: <Search />, 
      name: 'Buscar por Nombre', 
      type: 'name' as SearchFilterType,
      onClick: () => {
        onSearchBy?.('name');
        // desplazar y enfocar el input de búsqueda
        const el = document.getElementById('book-search-input');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // focus después de un pequeño delay para esperar al scroll
          setTimeout(() => (el as HTMLElement).focus(), 350);
        }
      },
      active: currentSearchFilter === 'name'
    },
    { 
      icon: <User />, 
      name: 'Buscar por Autor', 
      type: 'author' as SearchFilterType,
      onClick: () => {
        onSearchBy?.('author');
        const el = document.getElementById('book-search-input');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => (el as HTMLElement).focus(), 350);
        }
      },
      active: currentSearchFilter === 'author'
    },
    { 
      icon: <Calendar />, 
      name: 'Buscar por Año', 
      type: 'year' as SearchFilterType,
      onClick: () => {
        onSearchBy?.('year');
        const el = document.getElementById('book-search-input');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => (el as HTMLElement).focus(), 350);
        }
      },
      active: currentSearchFilter === 'year'
    },
  ];

  // Acción única para filtrar por categoría (abre modal)
  const categoryAction = {
    icon: <Tag />,
    name: 'Filtrar por Categoría',
    onClick: () => {
      setCategoryModalOpen(true);
    },
    active: !!currentCategoryId,
  };

  const clearAction = {
    icon: <X />,
    name: 'Limpiar filtros',
    type: null as SearchFilterType | null,
    onClick: () => {
      // clear search filter, sort and category
      onSearchBy?.(null);
      onSortBy?.(null);
      onFilterByCategory?.(null);
      // opcional: desplazar al top de la sección de libros
      const container = document.querySelector('[data-books-container]');
      if (container) {
        (container as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    active: !currentSearchFilter && !currentSort && !currentCategoryId,
  };

  const sortActions = [
    { 
      icon: <ArrowUpAZ />, 
      name: 'Ordenar Alfabéticamente', 
      type: 'alphabetical' as SortType,
      onClick: () => onSortBy?.('alphabetical'),
      active: currentSort === 'alphabetical'
    },
    { 
      icon: <Users />, 
      name: 'Ordenar por Autor', 
      type: 'author' as SortType,
      onClick: () => onSortBy?.('author'),
      active: currentSort === 'author'
    },
  ];

  const allActions = [
    ...searchActions, 
    categoryAction,
    ...sortActions, 
    clearAction
  ];

  // Obtener nombre de categoría seleccionada
  const selectedCategoryName = React.useMemo(() => {
    if (!currentCategoryId) return null;
    return mainCategories.find(cat => cat.category_id === currentCategoryId)?.category_name || null;
  }, [currentCategoryId, mainCategories]);

  // Manejar selección de categoría en el modal
  const handleCategorySelect = (categoryId: string | null) => {
    onFilterByCategory?.(categoryId);
    setCategoryModalOpen(false);
    setOpen(false);
    const container = document.querySelector('[data-books-container]');
    if (container) {
      (container as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Efecto para prevenir scroll cuando el modal está abierto
  React.useEffect(() => {
    if (categoryModalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [categoryModalOpen]);

  // Efecto para cerrar modal con Escape
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && categoryModalOpen) {
        setCategoryModalOpen(false);
      }
    };
    if (categoryModalOpen) {
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [categoryModalOpen]);

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
        <SpeedDial
          ariaLabel="Opciones de búsqueda y ordenamiento"
          sx={{ position: 'relative' }}
          icon={<SpeedDialIcon />}
          open={open}
          onOpen={() => setOpen(true)}
          onClose={() => setOpen(false)}
          direction="up"
        >
          {allActions.map((action, index) => (
            <SpeedDialAction
              key={action.name || `action-${index}`}
              icon={action.icon}
              tooltipTitle={action.name}
              onClick={() => {
                action.onClick();
                if (action.name !== 'Filtrar por Categoría') {
                  setOpen(false);
                }
              }}
              sx={{
                backgroundColor: action.active ? 'rgba(34, 197, 94, 0.2)' : undefined,
                '&:hover': {
                  backgroundColor: action.active ? 'rgba(34, 197, 94, 0.3)' : undefined,
                },
              }}
            />
          ))}
        </SpeedDial>
      </Box>

      {/* Modal de selección de categoría */}
      <AnimatePresence>
        {categoryModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1001] flex items-center justify-center"
            aria-modal="true"
            role="dialog"
          >
            {/* Overlay */}
            <motion.div
              onClick={() => setCategoryModalOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black"
            />

            {/* Modal panel */}
            <motion.div
              initial={{ y: 20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 mx-4 max-w-md w-full rounded-lg bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-6 shadow-lg border-2 border-blue-400 dark:border-gray-800"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Filtrar por Categoría
                </h2>
                <button
                  onClick={() => setCategoryModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  aria-label="Cerrar"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="category-select"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Selecciona una categoría
                  </label>
                  <select
                    id="category-select"
                    value={currentCategoryId || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      handleCategorySelect(value || null);
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
                  >
                    <option value="">Todas las categorías</option>
                    {loadingCategories ? (
                      <option disabled>Cargando categorías...</option>
                    ) : (
                      mainCategories.map((category) => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {selectedCategoryName && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      <span className="font-semibold">Categoría activa:</span> {selectedCategoryName}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => handleCategorySelect(null)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Limpiar Filtro
                  </button>
                  <button
                    onClick={() => setCategoryModalOpen(false)}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-blue-500 dark:bg-blue-600 text-white font-medium hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
