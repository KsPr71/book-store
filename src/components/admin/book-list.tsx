'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { useBooks } from '@/hooks';
import { deleteBook } from '@/lib/supabase/admin-books';
import { Trash2, Edit2, X, Search } from 'lucide-react';
import { BookEditForm } from './book-edit-form';
import type { BookWithRelations } from '@/types/database';
import { Input } from '@/components/ui/input';

export function BookList() {
  const { booksWithRelations, refreshBooks } = useBooks();
  const [editingBook, setEditingBook] = useState<BookWithRelations | null>(null);
  const [deletingBookId, setDeletingBookId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar libros basado en el término de búsqueda
  const filteredBooks = useMemo(() => {
    if (!searchTerm.trim()) {
      return booksWithRelations;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return booksWithRelations.filter((book) => {
      // Buscar en título
      const titleMatch = book.title.toLowerCase().includes(term);
      const subtitleMatch = book.subtitle?.toLowerCase().includes(term);
      
      // Buscar en autores
      const authorMatch = book.authors?.some(author => 
        author.full_name.toLowerCase().includes(term)
      );
      
      // Buscar en año de publicación
      let yearMatch = false;
      if (book.publication_date) {
        const year = new Date(book.publication_date).getFullYear().toString();
        yearMatch = year.includes(term);
      }
      
      return titleMatch || subtitleMatch || authorMatch || yearMatch;
    });
  }, [booksWithRelations, searchTerm]);

  const handleDelete = async (bookId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await deleteBook(bookId);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('Libro eliminado exitosamente');
        refreshBooks();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el libro');
    } finally {
      setLoading(false);
      setDeletingBookId(null);
    }
  };

  const handleEdit = (book: BookWithRelations) => {
    setEditingBook(book);
  };

  const handleCloseEdit = () => {
    setEditingBook(null);
    refreshBooks();
  };

  if (editingBook) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
            Editando: {editingBook.title}
          </h3>
          <button
            onClick={handleCloseEdit}
            className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <BookEditForm book={editingBook} onClose={handleCloseEdit} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          Lista de Libros ({filteredBooks.length} de {booksWithRelations.length})
        </h3>
        
        {/* Campo de búsqueda */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Buscar por nombre, autor o año..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Portada
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredBooks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {searchTerm ? `No se encontraron libros que coincidan con "${searchTerm}"` : 'No hay libros disponibles'}
                  </td>
                </tr>
              ) : (
                filteredBooks.map((book) => (
                  <tr
                    key={book.book_id}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      {book.cover_image_url ? (
                        <div className="relative h-16 w-12 rounded overflow-hidden">
                          <Image
                            key={book.cover_image_url}
                            src={book.cover_image_url}
                            alt={book.title}
                            fill
                            className="object-cover"
                            sizes="48px"
                            unoptimized={book.cover_image_url.includes('supabase')}
                            onError={(e) => {
                              console.error('Error loading book cover in list:', book.cover_image_url);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-12 bg-neutral-200 dark:bg-neutral-700 rounded flex items-center justify-center">
                          <span className="text-xs text-neutral-400">Sin imagen</span>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {book.title}
                      </div>
                      {book.subtitle && (
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">
                          {book.subtitle}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-neutral-700 dark:text-neutral-300">
                        {book.authors && book.authors.length > 0
                          ? book.authors.map(a => a.full_name).join(', ')
                          : 'Sin autor'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                        ${book.price.toFixed(2)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          book.status === 'available'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : book.status === 'out_of_stock'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {book.status === 'available'
                          ? 'Disponible'
                          : book.status === 'out_of_stock'
                          ? 'Agotado'
                          : 'Borrador'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(book)}
                          className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(book.book_id)}
                          disabled={loading && deletingBookId === book.book_id}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors disabled:opacity-50"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

