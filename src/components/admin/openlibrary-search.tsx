'use client';

import React, { useState } from 'react';
import { Search, Loader2, BookOpen, Check } from 'lucide-react';

interface OpenLibrarySearchProps {
  onSelectBook: (book: {
    title: string;
    subtitle?: string;
    isbn?: string;
    description?: string;
    publication_date?: string;
    page_count?: number;
    language?: string;
    cover_image_url?: string;
    authors?: string[];
    publishers?: string[];
  }) => void;
}

export function OpenLibrarySearch({ onSelectBook }: OpenLibrarySearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Array<{
    title: string;
    subtitle?: string;
    isbn?: string;
    description?: string;
    publication_date?: string;
    page_count?: number;
    language?: string;
    cover_image_url?: string;
    authors?: string[];
    publishers?: string[];
    openlibrary_key?: string;
    openlibrary_work_key?: string;
  }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Por favor ingresa un título o ISBN');
      return;
    }

    setSearching(true);
    setError(null);
    setResults([]);

    try {
      // Determinar si es ISBN (contiene solo números y guiones)
      const isISBN = /^[\d-]+$/.test(searchTerm.trim());
      const param = isISBN ? `isbn=${encodeURIComponent(searchTerm.trim())}` : `title=${encodeURIComponent(searchTerm.trim())}`;
      
      const response = await fetch(`/api/books/search-openlibrary?${param}&limit=10`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al buscar en Open Library');
      }

      console.log('Respuesta de la API:', data); // Debug
      
      if (isISBN && data.book) {
        // Si es búsqueda por ISBN, mostrar un solo resultado
        console.log('Libro encontrado por ISBN:', data.book); // Debug
        setResults([data.book]);
      } else {
        console.log('Libros encontrados por título:', data.books); // Debug
        setResults(data.books || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al buscar en Open Library');
      console.error('Error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectBook = async (book: {
    title: string;
    subtitle?: string;
    isbn?: string;
    description?: string;
    publication_date?: string;
    page_count?: number;
    language?: string;
    cover_image_url?: string;
    authors?: string[];
    publishers?: string[];
    openlibrary_key?: string;
    openlibrary_work_key?: string;
  }) => {
    console.log('Libro seleccionado:', book); // Debug
    setSelectedBook(book.title);
    
    // Si el libro tiene openlibrary_key o openlibrary_work_key, obtener detalles completos
    let bookDetails = book;
    if (book.openlibrary_key || book.openlibrary_work_key) {
      const workKey = book.openlibrary_key || book.openlibrary_work_key;
      if (workKey) {
        try {
          // Obtener detalles completos del work
          const response = await fetch(`/api/books/search-openlibrary?workKey=${encodeURIComponent(workKey)}`);
          const data = await response.json();
          
          if (data.success && data.book) {
            console.log('Detalles completos obtenidos:', data.book); // Debug
            bookDetails = data.book;
          }
        } catch (error) {
          console.warn('No se pudieron obtener detalles completos, usando datos básicos:', error);
        }
      }
    }

    // Formatear fecha de publicación
    let publicationDate = '';
    if (bookDetails.publication_date) {
      if (typeof bookDetails.publication_date === 'string') {
        // Si solo tiene el año (ej: "2005"), convertir a YYYY-MM-DD
        if (/^\d{4}$/.test(bookDetails.publication_date.trim())) {
          publicationDate = `${bookDetails.publication_date.trim()}-01-01`;
        } else if (bookDetails.publication_date.includes('T')) {
          // Si es una fecha ISO completa, extraer solo la parte de fecha
          publicationDate = bookDetails.publication_date.split('T')[0];
        } else if (bookDetails.publication_date.includes('-')) {
          // Si ya tiene formato YYYY-MM-DD o similar
          publicationDate = bookDetails.publication_date.split(' ')[0];
        } else {
          // Intentar parsear como año
          const year = parseInt(bookDetails.publication_date);
          if (!isNaN(year) && year > 1000 && year < 3000) {
            publicationDate = `${year}-01-01`;
          }
        }
      } else if (typeof bookDetails.publication_date === 'number') {
        publicationDate = `${bookDetails.publication_date}-01-01`;
      }
    }

    // Mapear idiomas comunes
    const languageMap: Record<string, string> = {
      'eng': 'Inglés',
      'spa': 'Español',
      'fre': 'Francés',
      'ger': 'Alemán',
      'ita': 'Italiano',
      'por': 'Portugués',
      'es': 'Español',
      'en': 'Inglés',
      'fr': 'Francés',
      'de': 'Alemán',
      'it': 'Italiano',
      'pt': 'Portugués',
    };
    
    // Normalizar el idioma
    let language = 'Español';
    if (bookDetails.language) {
      const langKey = String(bookDetails.language).toLowerCase().replace(/^\/languages\//, '').split('/')[0];
      language = languageMap[langKey] || String(bookDetails.language) || 'Español';
    }

    // Extraer descripción si viene como objeto
    let description: string | undefined = undefined;
    if (bookDetails.description) {
      if (typeof bookDetails.description === 'string') {
        description = bookDetails.description;
      } else if (typeof bookDetails.description === 'object' && 'value' in bookDetails.description) {
        description = String((bookDetails.description as { value: string }).value);
      }
    }

    const bookData = {
      title: bookDetails.title || book.title || '',
      subtitle: bookDetails.subtitle !== undefined && bookDetails.subtitle !== null ? bookDetails.subtitle : (book.subtitle !== undefined && book.subtitle !== null ? book.subtitle : undefined),
      isbn: bookDetails.isbn !== undefined && bookDetails.isbn !== null && bookDetails.isbn !== '' ? bookDetails.isbn : (book.isbn !== undefined && book.isbn !== null && book.isbn !== '' ? book.isbn : undefined),
      description: description !== undefined && description !== null && description !== '' ? String(description) : undefined,
      publication_date: publicationDate || undefined,
      page_count: bookDetails.page_count !== undefined && bookDetails.page_count !== null ? bookDetails.page_count : (book.page_count !== undefined && book.page_count !== null ? book.page_count : undefined),
      language: language || 'Español',
      cover_image_url: bookDetails.cover_image_url !== undefined && bookDetails.cover_image_url !== null && bookDetails.cover_image_url !== '' ? bookDetails.cover_image_url : (book.cover_image_url !== undefined && book.cover_image_url !== null && book.cover_image_url !== '' ? book.cover_image_url : undefined),
      authors: (() => {
        // Asegurar que los autores sean strings
        const authorsList = bookDetails.authors && bookDetails.authors.length > 0 ? bookDetails.authors : (book.authors || []);
        return authorsList.map((a: string | { name?: string; full_name?: string; author?: { name?: string } }) => {
          if (typeof a === 'string') return a;
          if (a && typeof a === 'object') {
            if (a.name) return String(a.name);
            if (a.full_name) return String(a.full_name);
            if (a.author && typeof a.author === 'object' && a.author.name) return String(a.author.name);
          }
          return String(a || '');
        }).filter((name: string) => name && name.trim() !== '' && name !== '[object Object]');
      })(),
      publishers: (() => {
        // Asegurar que los publishers sean strings
        const publishersList = bookDetails.publishers && bookDetails.publishers.length > 0 ? bookDetails.publishers : (book.publishers || []);
        return publishersList.map((p: string | { name?: string }) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && p.name) return String(p.name);
          return String(p || '');
        }).filter((p: string) => p && p.trim() !== '' && p !== '[object Object]');
      })(),
    };

    console.log('Datos formateados para el formulario:', bookData); // Debug
    onSelectBook(bookData);
  };

  return (
    <div className="mb-6 p-4 border border-gray-200 dark:border-neutral-700 rounded-lg bg-gray-50 dark:bg-neutral-900">
      <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white flex items-center gap-2">
        <BookOpen className="w-5 h-5" />
        Buscar en Open Library
      </h3>
      
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Buscar por título o ISBN..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={searching || !searchTerm.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {searching ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              Buscar
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {results.length} resultado(s) encontrado(s):
          </p>
          {results.map((book, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedBook === book.title
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-blue-300 dark:hover:border-blue-700'
              }`}
              onClick={() => handleSelectBook(book)}
            >
              <div className="flex items-start gap-3">
                {book.cover_image_url && (
                  <img
                    src={book.cover_image_url}
                    alt={book.title}
                    className="w-16 h-24 object-cover rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {book.title}
                        </h4>
                        {book.subtitle && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {book.subtitle}
                          </p>
                        )}
                        {book.authors && book.authors.length > 0 && (
                          <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 font-medium">
                            Autor(es): {book.authors.join(', ')}
                          </p>
                        )}
                        {book.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {typeof book.description === 'string' ? book.description.substring(0, 100) + '...' : ''}
                          </p>
                        )}
                        {book.isbn && (
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                            ISBN: {book.isbn}
                          </p>
                        )}
                        {book.page_count && (
                          <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                            Páginas: {book.page_count}
                          </p>
                        )}
                      </div>
                    {selectedBook === book.title && (
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedBook && (
        <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
          ✓ Libro &quot;{selectedBook}&quot; seleccionado. Los datos se han autocompletado en el formulario.
        </div>
      )}
    </div>
  );
}

