"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { useBooks } from "@/hooks";
import { useCardSize } from "@/contexts/CardSizeContext";
import BookSpeedDial from "@/components/ui/speedDial";
import { createWhatsAppUrl } from "@/lib/utils/whatsapp";

import type { BookWithRelations } from '@/types/database';

interface BookCardProps {
  book: BookWithRelations;
}

function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  const { cardSize } = useCardSize();
  
  // Obtener la primera categoría para mostrar en el chip
  const firstCategory = book.categories && book.categories.length > 0 ? book.categories[0] : null;
  // Obtener el autor principal (el primero con role 'main_author' o simplemente el primero)
  const mainAuthor = book.authors?.find(author => author.role === 'main_author') || book.authors?.[0];
  
  // Debug: verificar si hay autores
  if (process.env.NODE_ENV === 'development' && !mainAuthor) {
    console.log(`⚠️ Libro "${book.title}" no tiene autores asociados. Asegúrate de crear registros en la tabla book_authors.`);
  }
  
  // Crear URL y manejador de WhatsApp
  const { url: whatsappUrl, onClick: handleWhatsAppClick } = createWhatsAppUrl({
    title: book.title,
    author: mainAuthor?.full_name,
    price: book.price
  });

  const handleCardClick = () => {
    router.push(`/book/${book.book_id}`);
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
                  src={book.cover_image_url}
                  alt={book.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  loading="lazy"
                  onError={(e) => {
                    // Si la imagen falla, ocultarla y mostrar placeholder
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><span class="text-gray-400 dark:text-gray-500 text-xs">Error al cargar</span></div>';
                    }
                  }}
                  onLoadStart={() => {
                    // Prevenir errores de timeout silenciosamente
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
          
          {/* Sección de información y acción - Precio y WhatsApp en la misma línea */}
          <div 
            className="mt-3 flex items-center gap-2" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
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

            {/* Botón de WhatsApp - Diseño premium */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleWhatsAppClick}
              onMouseDown={(e) => e.stopPropagation()}
              className="group/wa relative flex items-center justify-center gap-2 flex-1 rounded-lg bg-gradient-to-r from-[#25D366] to-[#20BA5A] hover:from-[#20BA5A] hover:to-[#1DA851] text-white transition-all duration-300 cursor-pointer px-4 py-2.5 shadow-lg hover:shadow-xl hover:shadow-[#25D366]/30 active:scale-[0.98] overflow-hidden"
            >
              {/* Efecto de brillo al hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/wa:translate-x-full transition-transform duration-700"></div>
              
              {/* Icono de WhatsApp */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="flex-shrink-0 relative z-10 group-hover/wa:scale-110 transition-transform duration-300"
                style={{
                  width: `${Math.max(1.25, cardSize * 0.06)}rem`,
                  height: `${Math.max(1.25, cardSize * 0.06)}rem`
                }}
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              
              {/* Texto del botón */}
              <span 
                className="font-semibold relative z-10 tracking-wide group-hover/wa:tracking-wider transition-all duration-300 whitespace-nowrap"
                style={{
                  fontSize: `${Math.max(0.8, cardSize * 0.042)}rem`
                }}
              >
                Solicitar por WhatsApp
              </span>
            </a>
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
