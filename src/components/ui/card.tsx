"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { useBooks } from "@/hooks";
import { useCardSize } from "@/contexts/CardSizeContext";
import BookSpeedDial from "@/components/ui/speedDial";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import type { BookWithRelations } from '@/types/database';

interface BookCardProps {
  book: BookWithRelations;
}

function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const { cardSize } = useCardSize();
  const { user } = useAuth();
  const { addToCart, items } = useCart();
  const showCartText = cardSize >= 18.5;
  const [isAdding, setIsAdding] = React.useState(false);
  
  // Obtener la primera categoría para mostrar en el chip
  const firstCategory = book.categories && book.categories.length > 0 ? book.categories[0] : null;
  // Obtener el autor principal (el primero con role 'main_author' o simplemente el primero)
  const mainAuthor = book.authors?.find(author => author.role === 'main_author') || book.authors?.[0];
  
  // Debug: verificar si hay autores
  if (process.env.NODE_ENV === 'development' && !mainAuthor) {
    console.log(`⚠️ Libro "${book.title}" no tiene autores asociados. Asegúrate de crear registros en la tabla book_authors.`);
  }
  
  // Verificar si el libro ya está en el carrito
  const isInCart = items.some(item => item.book_id === book.book_id);

  const handleCardClick = () => {
    router.push(`/book/${book.book_id}`);
  };

  const handleAddToCart = async (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!user) {
      router.push('/login');
      return;
    }

    if (book.status !== 'available') {
      alert('Este libro no está disponible');
      return;
    }

    setIsAdding(true);
    try {
      await addToCart(book, 1);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al agregar al carrito');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer w-full">
      <CardContainer className="inter-var w-full" containerClassName="py-0 w-full">
        <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-blue-500/[0.1] dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 dark:border-blue-500 border-black/[0.1] w-full h-auto rounded-xl p-3 border transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-blue-500/50 hover:border-blue-500/60 dark:hover:border-blue-400 hover:bg-gray-100 dark:hover:from-neutral-800 dark:hover:via-neutral-700 dark:hover:to-neutral-800">
          {/* Contenedor de imagen con elementos absolutos */}
          <CardItem translateZ="100" className="w-full relative">
            {book.cover_image_url ? (
              <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover/card:shadow-xl transition-all duration-300">
                <Image
                  key={book.cover_image_url}
                  src={book.cover_image_url}
                  alt={book.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                  unoptimized={book.cover_image_url.includes('supabase')}
                  onError={(e) => {
                    // Si la imagen falla, ocultarla y mostrar placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><span class="text-gray-400 dark:text-gray-500 text-xs">Error al cargar</span></div>';
                    }
                  }}
                />
                
                {/* Chip de disponible - Esquina superior izquierda */}
                {book.status !== 'draft' && (
                  <div className="absolute top-2 left-2 z-10">
                    <CardItem
                      translateZ={20}
                      className={`inline-block px-2 py-1 rounded text-[10px] font-semibold whitespace-nowrap shadow-md backdrop-blur-sm ${
                        book.status === 'available'
                          ? 'bg-blue-500/90 text-white dark:bg-blue-600/90'
                          : 'bg-red-500/90 text-white dark:bg-red-600/90'
                      }`}
                    >
                      {book.status === 'available' ? 'Disponible' : 'Agotado'}
                    </CardItem>
                  </div>
                )}

                {/* Categoría - Parte inferior con efecto blur */}
                {firstCategory && (
                  <div className="absolute bottom-0 left-0 right-0 z-10">
                    <CardItem
                      translateZ={25}
                      className="w-full px-3 py-4 bg-black/20 dark:bg-black/30 backdrop-blur-md border-t border-white/10"
                    >
                      <span className="text-white font-semibold text-xs block text-center drop-shadow-lg">
                        {firstCategory.category_name}
                      </span>
                    </CardItem>
                  </div>
                )}

              </div>
            ) : (
              <div className="relative w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-gray-400 dark:text-gray-500">Sin portada</span>
              </div>
            )}
          </CardItem>

          {/* Título debajo de la imagen */}
          <div className="mt-3 px-1">
            <CardItem
              translateZ="50"
              className="font-bold text-neutral-600 dark:text-white line-clamp-2 w-full"
              style={{
                fontSize: `${Math.max(0.9, cardSize * 0.052)}rem`
              }}
            >
              {book.title}
            </CardItem>
          </div>
          
          {/* Autor debajo del título */}
          {mainAuthor && (
            <div className="px-1 mt-1">
              <CardItem
                translateZ="45"
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300 line-clamp-1"
              >
                {mainAuthor.full_name}
              </CardItem>
            </div>
          )}
          
          {/* Sección de información y acción - Precio y Carrito */}
          <div 
            className="mt-3 flex items-center gap-2" 
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseUp={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            {/* Precio - Destacado con gradiente */}
            <CardItem
              translateZ={30}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 backdrop-blur-sm text-neutral-800 dark:text-neutral-100 font-bold shadow-md border border-neutral-300/50 dark:border-neutral-700/50 transition-all duration-300 group-hover/card:from-blue-500 group-hover/card:to-blue-600 group-hover/card:text-white group-hover/card:border-blue-400/50 group-hover/card:shadow-lg group-hover/card:scale-105 flex-shrink-0"
              style={{
                fontSize: `${Math.max(0.85, cardSize * 0.045)}rem`
              }}
            >
              ${book.price.toFixed(2)}
            </CardItem>

            {/* Botón de Carrito - Diseño simple */}
            <button
              onClick={handleAddToCart}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
              disabled={isAdding || isInCart || book.status !== 'available'}
              className={`flex items-center justify-center ${showCartText ? 'gap-2 px-4' : 'gap-0 px-3'} flex-1 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white transition-colors cursor-pointer py-2.5`}
            >
              {/* Icono de Carrito */}
              {isInCart ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="flex-shrink-0"
                  style={{
                    width: `${Math.max(1.25, cardSize * 0.06)}rem`,
                    height: `${Math.max(1.25, cardSize * 0.06)}rem`
                  }}
                >
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-shrink-0"
                  style={{
                    width: `${Math.max(1.25, cardSize * 0.06)}rem`,
                    height: `${Math.max(1.25, cardSize * 0.06)}rem`
                  }}
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              )}
              
              {/* Texto del botón */}
              {showCartText ? (
                <span 
                  className="font-semibold whitespace-nowrap"
                  style={{
                    fontSize: `${Math.max(0.8, cardSize * 0.042)}rem`
                  }}
                >
                  {isAdding ? 'Agregando...' : isInCart ? 'En carrito' : 'Agregar al carrito'}
                </span>
              ) : (
                <span className="sr-only">
                  {isAdding ? 'Agregando...' : isInCart ? 'En carrito' : 'Agregar al carrito'}
                </span>
              )}
            </button>
          </div>
        </CardBody>
      </CardContainer>
    </div>
  );
}

export function ThreeDCardDemo() {
  const { booksWithRelations, loading } = useBooks();
  const { cardSize } = useCardSize();
  const [searchFilter, setSearchFilter] = React.useState<'name' | 'author' | 'year' | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortType, setSortType] = React.useState<'alphabetical' | 'author' | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = React.useState<string | null>(null);
  const observerRef = React.useRef<MutationObserver | null>(null);

  // Efecto para asegurar focus cuando searchFilter cambia a name/author
  React.useEffect(() => {
    if (!searchFilter) return;

    const focusIfAvailable = () => {
      const el = document.getElementById('book-search-input') as HTMLInputElement | null;
      if (el) {
        // desplazar al elemento y focus
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
        return true;
      }
      return false;
    };

    // Intentar inmediatamente
    if (focusIfAvailable()) return;

    // Si no está todavía en el DOM, observar cambios ligeros en el body
    const observer = new MutationObserver(() => {
      if (focusIfAvailable()) {
        if (observerRef.current) {
          observerRef.current.disconnect();
          observerRef.current = null;
        }
      }
    });
    observerRef.current = observer;
    observer.observe(document.body, { childList: true, subtree: true });

    // Timeout de fallback para desconectar
    const timeout = setTimeout(() => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }, 2000);

    return () => {
      clearTimeout(timeout);
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [searchFilter]);

  // Filtrar solo libros disponibles o en draft
  const availableBooks = React.useMemo(() => {
    return booksWithRelations.filter(
      (book) => book.status === 'available' || book.status === 'draft'
    );
  }, [booksWithRelations]);

  // Filtrar libros según el tipo de búsqueda y categoría
  const filteredBooks = React.useMemo(() => {
    let books = availableBooks;

    // Filtrar por categoría primero
    if (selectedCategoryId) {
      books = books.filter((book) =>
        book.categories?.some((cat) => cat.category_id === selectedCategoryId)
      );
    }

    // Luego filtrar por búsqueda si hay término de búsqueda
    if (searchTerm.trim() && searchFilter) {
      const term = searchTerm.toLowerCase().trim();

      books = books.filter((book) => {
        switch (searchFilter) {
          case 'name':
            return (
              book.title.toLowerCase().includes(term) ||
              book.subtitle?.toLowerCase().includes(term)
            );
          case 'author':
            return book.authors?.some((author) =>
              author.full_name.toLowerCase().includes(term)
            );
          case 'year':
            if (book.publication_date) {
              const year = new Date(book.publication_date).getFullYear().toString();
              return year.includes(term);
            }
            return false;
          default:
            return true;
        }
      });
    }

    return books;
  }, [availableBooks, searchTerm, searchFilter, selectedCategoryId]);

  // Ordenar libros
  const sortedBooks = React.useMemo(() => {
    if (!sortType) {
      return filteredBooks;
    }

    const books = [...filteredBooks];

    switch (sortType) {
      case 'alphabetical':
        return books.sort((a, b) => a.title.localeCompare(b.title));
      case 'author':
        return books.sort((a, b) => {
          const authorA = a.authors?.[0]?.full_name || '';
          const authorB = b.authors?.[0]?.full_name || '';
          return authorA.localeCompare(authorB);
        });
      default:
        return books;
    }
  }, [filteredBooks, sortType]);

  const displayBooks = sortedBooks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando libros...</p>
      </div>
    );
  }

  if (booksWithRelations.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">No hay libros disponibles</p>
      </div>
    );
  }

  return (
    <div className="py-5 px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 w-full relative">
      {/* Campo de búsqueda */}
      {searchFilter && (
        <div className="mb-6 max-w-md mx-auto">
          <input
            id="book-search-input"
            type="text"
            placeholder={
              searchFilter === 'name'
                ? 'Buscar por nombre del libro...'
                : searchFilter === 'author'
                ? 'Buscar por nombre del autor...'
                : 'Buscar por año de publicación...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      )}

      {/* SpeedDial */}
      <BookSpeedDial
        onSearchBy={(type) => {
          setSearchFilter(type);
          if (!type) {
            setSearchTerm('');
          }
        }}
        onSortBy={(type) => setSortType(type)}
        onFilterByCategory={(categoryId) => {
          setSelectedCategoryId(categoryId);
          // Limpiar búsqueda cuando se filtra por categoría
          if (categoryId) {
            setSearchFilter(null);
            setSearchTerm('');
          }
        }}
        currentSearchFilter={searchFilter}
        currentSort={sortType}
        currentCategoryId={selectedCategoryId}
      />

      {displayBooks.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">
            {searchTerm
              ? `No se encontraron libros que coincidan con "${searchTerm}"`
              : 'No hay libros disponibles'}
          </p>
        </div>
      ) : (
        <div 
          data-books-container
          className="grid gap-4 sm:gap-5 lg:gap-6 w-full"
          style={{
            gridTemplateColumns: `repeat(auto-fill, ${cardSize}rem)`
          }}
        >
          {displayBooks.map((book) => (
            <BookCard key={book.book_id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
