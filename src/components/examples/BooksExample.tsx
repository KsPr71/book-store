'use client';

/**
 * Componente de ejemplo mostrando cómo usar los hooks para acceder a los datos
 * Puedes usar este como referencia para crear tus propios componentes
 */

import Image from 'next/image';
import Link from 'next/link';
import { useBooks, useAuthors, useCategories } from '@/hooks';
import { InfiniteMovingCards } from '../ui/infinite-moving-cards';

export function BooksExample() {
  const { books, featuredBooks, booksWithRelations, loading: loadingBooks } = useBooks();
  const { authors, loading: loadingAuthors } = useAuthors();
  const { mainCategories, loading: loadingCategories } = useCategories();

  if (loadingBooks || loadingAuthors || loadingCategories) {
    return (
      <div className="p-2">
        <p className="text-sm">Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Resumen compacto */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 border rounded bg-neutral-50 dark:bg-neutral-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">Libros</p>
          <p className="text-xl font-bold">{books.length}</p>
        </div>
        <div className="p-2 border rounded bg-neutral-50 dark:bg-neutral-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">Autores</p>
          <p className="text-xl font-bold">{authors.length}</p>
        </div>
        <div className="p-2 border rounded bg-neutral-50 dark:bg-neutral-900">
          <p className="text-xs text-gray-600 dark:text-gray-400">Categorías</p>
          <p className="text-xl font-bold">{mainCategories.length}</p>
        </div>
      </div>

      {/* Libros Destacados compactos */}
      {featuredBooks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Libros Destacados</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {featuredBooks.slice(0, 6).map((book) => {
              // Buscar el libro con relaciones para obtener el autor
              const bookWithRelations = booksWithRelations.find(b => b.book_id === book.book_id);
              const mainAuthor = bookWithRelations?.authors?.[0];
              
              return (
              <Link
                key={book.book_id}
                href={`/book/${book.book_id}`}
                className="flex gap-3 border rounded p-3 hover:shadow-md transition-shadow bg-white dark:bg-neutral-900"
              >
                {book.cover_image_url && (
                  <div className="relative h-32 w-20 shrink-0 rounded overflow-hidden">
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-medium text-sm line-clamp-2 mb-1 text-neutral-900 dark:text-neutral-100">{book.title}</h4>
                    {book.subtitle && (
                      <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-1 mb-2">{book.subtitle}</p>
                    )}
                    {mainAuthor && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-2">
                        {mainAuthor.full_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-auto">
                    {book.price > 0 && (
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">${book.price.toFixed(2)}</span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        book.status === 'available'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : book.status === 'out_of_stock'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {book.status === 'available' ? 'Disponible' : book.status === 'out_of_stock' ? 'Agotado' : 'Borrador'}
                    </span>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Categorías compactas */}
      {mainCategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Categorías</h3>
          <div className="flex flex-wrap gap-1.5">
            {mainCategories.map((category) => (
              <span
                key={category.category_id}
                className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs"
              >
                {category.category_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Autores compactos */}
      {authors.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-neutral-800 dark:text-neutral-200">Autores</h3>
          <InfiniteMovingCards items={authors.slice(0, 12).map((author) => ({
            name: author.full_name,
            title: author.nationality || undefined,
            photo_url: author.photo_url || undefined,
          }))} />
          
        </div>
      )}
    </div>
  );
}

