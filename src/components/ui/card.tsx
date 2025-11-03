"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CardBody, CardContainer, CardItem } from "@/components/ui/3d-card";
import { useBooks } from "@/hooks";
import BookSpeedDial from "@/components/ui/speedDial";

import type { BookWithRelations } from '@/types/database';

interface BookCardProps {
  book: BookWithRelations;
}

function BookCard({ book }: BookCardProps) {
  const router = useRouter();
  
  // Obtener la primera categoría para mostrar en el chip
  const firstCategory = book.categories && book.categories.length > 0 ? book.categories[0] : null;
  // Obtener el autor principal (el primero con role 'main_author' o simplemente el primero)
  const mainAuthor = book.authors?.find(author => author.role === 'main_author') || book.authors?.[0];
  
  // Debug: verificar si hay autores
  if (process.env.NODE_ENV === 'development' && !mainAuthor) {
    console.log(`⚠️ Libro "${book.title}" no tiene autores asociados. Asegúrate de crear registros en la tabla book_authors.`);
  }
  
  // Número de WhatsApp del admin (cambia este número por el número real del admin)
  // Formato: código de país + número (ejemplo: 521234567890 para México: +52 12 3456 7890)
  const ADMIN_WHATSAPP_NUMBER = '52708602'; // TODO: Reemplazar con el número real del admin
  
  // Crear mensaje de WhatsApp dirigido al admin
  const whatsappMessage = encodeURIComponent(
    `¡Hola! 👋\n\nMe interesa solicitar el siguiente libro:\n\n📚 *${book.title}*${mainAuthor ? `\n👤 Autor: ${mainAuthor.full_name}` : ''}${book.price ? `\n💰 Precio: $${book.price.toFixed(2)}` : ''}\n\n¿Podrías ayudarme con más información?`
  );
  // URL de WhatsApp con el número del admin y mensaje prellenado
  const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP_NUMBER}?text=${whatsappMessage}`;
  
  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation(); // Prevenir que el click se propague a la card
    e.preventDefault(); // Prevenir el comportamiento por defecto del enlace
    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = () => {
    router.push(`/book/${book.book_id}`);
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer w-full">
      <CardContainer className="inter-var w-full" containerClassName="py-0 w-full">
        <CardBody className="bg-gray-50 relative group/card dark:hover:shadow-2xl dark:hover:shadow-blue-500/[0.1] dark:bg-black dark:border-white/[0.2] border-black/[0.1] w-full h-auto rounded-xl p-4 border transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/30 dark:hover:shadow-magenta-500/40 hover:border-blue-500/60 dark:hover:border-magenta-500/60 px-3 py-3">
        {/* Imagen con overlay de descripción al hover */}
        <CardItem translateZ="100" className="w-full">
          {book.cover_image_url ? (
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-md group-hover/card:shadow-2xl group-hover/card:shadow-gray-900/40 dark:group-hover/card:shadow-black/60 transition-all duration-300">
              <Image
                src={book.cover_image_url}
                alt={book.title}
                fill
                className="object-cover transition-transform duration-300 group-hover/card:scale-105 margin-10"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              {/* Overlay con descripción al hover con efecto blur - solo en el tercio inferior */}
              {book.description && (
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/30 backdrop-blur-sm opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center p-4">
                  <p className="text-white text-sm text-center font-medium leading-relaxed line-clamp-3 drop-shadow-lg">
                    {book.description}
                  </p>
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
        <CardItem
          translateZ="50"
          className="text-xl font-bold text-neutral-600 dark:text-white line-clamp-2 mt-4"
        >
          {book.title}
        </CardItem>
        
        {/* Autor debajo del título con énfasis */}
        {mainAuthor && (
          <CardItem
            translateZ="45"
            className="text-base font-semibold text-neutral-700 dark:text-neutral-300 mt-2"
          >
            {mainAuthor.full_name}
          </CardItem>
        )}
        
        {book.subtitle && (
          <CardItem
            translateZ="40"
            className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-1"
          >
            {book.subtitle}
          </CardItem>
        )}

        {/* Chip de categoría/género */}
        {firstCategory && (
          <div className="mt-3">
            <CardItem
              translateZ={10}
              className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
            >
              {firstCategory.category_name}
            </CardItem>
          </div>
        )}

        {/* Footer con precio */}
        <div className="flex justify-between items-center mt-6 gap-2">
          <CardItem
            translateZ={20}
            className="px-3 py-2 rounded-xl text-xs font-normal dark:text-white flex-1 text-center"
          >
            Ver detalles →
          </CardItem>
          <CardItem
            translateZ={20}
            className="px-3 py-2 rounded-xl bg-black dark:bg-white dark:text-black text-white text-xs font-bold"
          >
            ${book.price.toFixed(2)}
          </CardItem>
        </div>
        
        {/* Botón de WhatsApp */}
        <div 
          className="mt-3" 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
        >
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-medium transition-colors duration-200 w-full cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Solicitar por WhatsApp
          </a>
        </div>
        
        {/* Estado del libro (solo si está disponible o agotado, no mostrar borrador) */}
        {book.status !== 'draft' && (
          <div className="mt-2">
            <CardItem
              translateZ={10}
              className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                book.status === 'available'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {book.status === 'available' ? 'Disponible' : 'Agotado'}
            </CardItem>
          </div>
        )}
      </CardBody>
    </CardContainer>
    </div>
  );
}

export function ThreeDCardDemo() {
  const { booksWithRelations, loading } = useBooks();
  const [searchFilter, setSearchFilter] = React.useState<'name' | 'author' | 'year' | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortType, setSortType] = React.useState<'alphabetical' | 'author' | null>(null);

  // Filtrar solo libros disponibles o en draft
  const availableBooks = React.useMemo(() => {
    return booksWithRelations.filter(
      (book) => book.status === 'available' || book.status === 'draft'
    );
  }, [booksWithRelations]);

  // Filtrar libros según el tipo de búsqueda
  const filteredBooks = React.useMemo(() => {
    if (!searchTerm.trim() || !searchFilter) {
      return availableBooks;
    }

    const term = searchTerm.toLowerCase().trim();

    return availableBooks.filter((book) => {
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
  }, [availableBooks, searchTerm, searchFilter]);

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
        currentSearchFilter={searchFilter}
        currentSort={sortType}
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
          className="grid gap-4 sm:gap-5 lg:gap-6 w-full"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, 22rem)'
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
