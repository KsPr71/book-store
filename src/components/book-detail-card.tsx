'use client';

import React from 'react';
import Image from 'next/image';
import type { BookWithRelations } from '@/types/database';

interface BookDetailCardProps {
  book: BookWithRelations;
}

export function BookDetailCard({ book }: BookDetailCardProps) {
  // Obtener el autor principal
  const mainAuthor = book.authors?.find(author => author.role === 'main_author') || book.authors?.[0];
  
  // Crear mensaje de WhatsApp
  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa solicitar el libro "${book.title}"${mainAuthor ? ` de ${mainAuthor.full_name}` : ''}.`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  // Formatear fecha de publicación
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'No especificada';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Formatear tamaño de archivo
  const formatFileSize = (size?: number | null) => {
    if (!size) return 'No especificado';
    if (size < 1024) return `${size} KB`;
    return `${(size / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg overflow-hidden border border-neutral-200 dark:border-neutral-800">
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-8">
          {/* Columna 1: Imagen */}
          <div className="lg:col-span-1">
            {book.cover_image_url ? (
              <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={book.cover_image_url}
                  alt={book.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            ) : (
              <div className="relative w-full aspect-[2/3] bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-gray-400 dark:text-gray-500">Sin portada</span>
              </div>
            )}
          </div>

          {/* Columna 2-3: Información */}
          <div className="lg:col-span-2 space-y-6">
            {/* Título y subtítulo */}
            <div>
              <h1 className="text-4xl font-bold text-neutral-900 dark:text-white mb-2">
                {book.title}
              </h1>
              {book.subtitle && (
                <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-4">
                  {book.subtitle}
                </p>
              )}
            </div>

            {/* Autor */}
            {mainAuthor && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-500 dark:text-neutral-400">Por</span>
                <span className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">
                  {mainAuthor.full_name}
                </span>
              </div>
            )}

            {/* Categorías */}
            {book.categories && book.categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {book.categories.map((category) => (
                  <span
                    key={category.category_id}
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {category.category_name}
                  </span>
                ))}
              </div>
            )}

            {/* Descripción completa */}
            {book.description && (
              <div>
                <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                  Descripción
                </h2>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {book.description}
                </p>
              </div>
            )}

            {/* Información adicional */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              {book.isbn && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">ISBN:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">{book.isbn}</p>
                </div>
              )}
              {book.publication_date && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Fecha de publicación:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {formatDate(book.publication_date)}
                  </p>
                </div>
              )}
              {book.language && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Idioma:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">{book.language}</p>
                </div>
              )}
              {book.page_count && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Páginas:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">{book.page_count}</p>
                </div>
              )}
              {book.file_format && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Formato:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">{book.file_format}</p>
                </div>
              )}
              {book.file_size && (
                <div>
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Tamaño:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">
                    {formatFileSize(book.file_size)}
                  </p>
                </div>
              )}
              {book.publisher && (
                <div className="col-span-2">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">Editorial:</span>
                  <p className="text-neutral-800 dark:text-neutral-200 font-medium">{book.publisher.name}</p>
                </div>
              )}
            </div>

            {/* Precio y botones de acción */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                  ${book.price.toFixed(2)}
                </span>
                {book.status === 'available' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Disponible
                  </span>
                )}
                {book.status === 'out_of_stock' && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    Agotado
                  </span>
                )}
              </div>
              <div className="flex gap-4">
                {book.status === 'available' && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium transition-colors duration-200"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="w-5 h-5"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    Solicitar por WhatsApp
                  </a>
                )}
                {book.sample_url && (
                  <a
                    href={book.sample_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white font-medium transition-colors duration-200"
                  >
                    Ver muestra
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

