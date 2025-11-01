'use client';

/**
 * Componente de ejemplo mostrando cómo usar los hooks para acceder a los datos
 * Puedes usar este como referencia para crear tus propios componentes
 */

import Image from 'next/image';
import { useBooks, useAuthors, useCategories } from '@/hooks';

export function BooksExample() {
  const { books, featuredBooks, loading: loadingBooks } = useBooks();
  const { authors, loading: loadingAuthors } = useAuthors();
  const { mainCategories, loading: loadingCategories } = useCategories();

  if (loadingBooks || loadingAuthors || loadingCategories) {
    return (
      <div className="p-4">
        <p>Cargando datos de la base de datos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-8">
      {/* Resumen */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Resumen</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Total de Libros</p>
            <p className="text-3xl font-bold">{books.length}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Total de Autores</p>
            <p className="text-3xl font-bold">{authors.length}</p>
          </div>
          <div className="p-4 border rounded">
            <p className="text-sm text-gray-600">Categorías Principales</p>
            <p className="text-3xl font-bold">{mainCategories.length}</p>
          </div>
        </div>
      </section>

      {/* Libros Destacados */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Libros Destacados</h2>
        {featuredBooks.length === 0 ? (
          <p className="text-gray-500">No hay libros destacados aún.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredBooks.slice(0, 6).map((book) => (
              <div key={book.book_id} className="border rounded p-4">
                {/* Mostrar portada (cover_image_url) si existe */}
                {book.cover_image_url && (
                  <div className="relative w-full h-48 rounded mb-4 overflow-hidden">
                    <Image
                      src={book.cover_image_url}
                      alt={book.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // Ocultar imagen si no carga
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <h3 className="font-semibold text-lg">{book.title}</h3>
                {book.subtitle && (
                  <p className="text-sm text-gray-600">{book.subtitle}</p>
                )}
                {book.price > 0 && (
                  <p className="text-lg font-bold mt-2">${book.price.toFixed(2)}</p>
                )}
                <span
                  className={`inline-block mt-2 px-2 py-1 rounded text-xs ${
                    book.status === 'available'
                      ? 'bg-green-100 text-green-800'
                      : book.status === 'out_of_stock'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {book.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Lista de Categorías */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Categorías</h2>
        {mainCategories.length === 0 ? (
          <p className="text-gray-500">No hay categorías aún.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {mainCategories.map((category) => (
              <span
                key={category.category_id}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {category.category_name}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Lista de Autores */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Autores</h2>
        {authors.length === 0 ? (
          <p className="text-gray-500">No hay autores aún.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {authors.slice(0, 8).map((author) => (
              <div key={author.author_id} className="border rounded p-3">
                <p className="font-semibold">{author.full_name}</p>
                {author.nationality && (
                  <p className="text-sm text-gray-600">{author.nationality}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

