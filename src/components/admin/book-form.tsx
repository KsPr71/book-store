'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';
import { createBook, associateAuthorWithBook, associateCategoryWithBook } from '@/lib/supabase/admin-books';
import { uploadBookCover } from '@/lib/supabase/storage';
import { getAllAuthors } from '@/lib/supabase/authors';
import { getAllCategories } from '@/lib/supabase/categories';
import { getAllPublishers } from '@/lib/supabase/publishers';
import type { Author, Category, Publisher, BookStatus } from '@/types/database';
import { useBooks } from '@/hooks';
import { OpenLibrarySearch } from './openlibrary-search';

export function BookForm() {
  const { refreshBooks } = useBooks();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    isbn: '',
    description: '',
    publication_date: '',
    publisher_id: '',
    language: 'Español',
    page_count: '',
    file_size: '',
    file_format: 'EPUB',
    cover_image_url: '',
    sample_url: '',
    full_content_url: '',
    price: '',
    is_featured: false,
    status: 'available' as 'available' | 'draft' | 'out_of_stock',
  });

  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [openLibraryAuthors, setOpenLibraryAuthors] = useState<string[]>([]);

  useEffect(() => {
    // Cargar autores, categorías y publishers
    Promise.all([
      getAllAuthors(),
      getAllCategories(),
      getAllPublishers(),
    ]).then(([authorsData, categoriesData, publishersData]) => {
      setAuthors(authorsData || []);
      setCategories(categoriesData || []);
      setPublishers(publishersData || []);
    });
  }, []);

  const handleImageUpload = async (file: File) => {
    // Generar un ID temporal para el libro
    const tempId = `temp-${Date.now()}`;
    
    const result = await uploadBookCover(tempId, file);

    if (result.url) {
      setCoverImageUrl(result.url);
      setFormData({ ...formData, cover_image_url: result.url });
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Crear el libro
      const bookResult = await createBook({
        isbn: formData.isbn || null,
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description || null,
        publication_date: formData.publication_date || null,
        publisher_id: formData.publisher_id || null,
        language: formData.language,
        page_count: formData.page_count ? parseInt(formData.page_count) : null,
        file_size: formData.file_size ? parseFloat(formData.file_size) : null,
        file_format: formData.file_format || null,
        cover_image_url: coverImageUrl,
        sample_url: formData.sample_url || null,
        full_content_url: formData.full_content_url || null,
        price: parseFloat(formData.price) || 0,
        is_featured: formData.is_featured,
        status: formData.status,
      });

      if (bookResult.error || !bookResult.data) {
        setError(bookResult.error || 'Error al crear el libro');
        setLoading(false);
        return;
      }

      const bookId = bookResult.data.book_id;

      // Asociar autores
      for (const authorId of selectedAuthors) {
        await associateAuthorWithBook(bookId, authorId, 'main_author');
      }

      // Asociar categorías
      for (const categoryId of selectedCategories) {
        await associateCategoryWithBook(bookId, categoryId);
      }

      setSuccess(true);
      refreshBooks();
      
      // Enviar push notifications a los usuarios suscritos
      if (bookResult.data.status === 'available') {
        try {
          console.log('📤 Enviando push notifications para libro:', bookResult.data.title);
          const response = await fetch('/api/notifications/send-push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              book: {
                book_id: bookResult.data.book_id,
                title: bookResult.data.title,
                cover_image_url: bookResult.data.cover_image_url,
              },
            }),
          });
          
          const result = await response.json();
          console.log('📬 Respuesta del servidor:', result);
          
          if (result.ok) {
            if (result.sent > 0) {
              console.log(`✅ Push notifications enviadas a ${result.sent} usuario(s)`);
            } else {
              console.warn('⚠️ No hay usuarios suscritos a push notifications');
            }
          } else {
            console.error('❌ Error en el servidor:', result.error);
          }
        } catch (err) {
          console.error('❌ Error enviando push notifications:', err);
          // No fallar la creación del libro si falla el envío de notificaciones
        }
      } else {
        console.log('ℹ️ Libro creado con estado:', bookResult.data.status, '- No se envían notificaciones');
      }
      
      // Resetear formulario
      setTimeout(() => {
        setFormData({
          title: '',
          subtitle: '',
          isbn: '',
          description: '',
          publication_date: '',
          publisher_id: '',
          language: 'Español',
          page_count: '',
          file_size: '',
          file_format: 'EPUB',
          cover_image_url: '',
          sample_url: '',
          full_content_url: '',
          price: '',
          is_featured: false,
          status: 'available',
        });
        setSelectedAuthors([]);
        setSelectedCategories([]);
        setCoverImageUrl(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLibrarySelect = (book: {
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
  }) => {
    console.log('Autocompletando formulario con:', book); // Debug
    
    // Formatear fecha para el input de tipo date (YYYY-MM-DD)
    let formattedDate = '';
    if (book.publication_date) {
      const dateStr = String(book.publication_date).trim();
      // Si solo tiene el año (ej: "2005"), convertir a YYYY-MM-DD
      if (/^\d{4}$/.test(dateStr)) {
        formattedDate = `${dateStr}-01-01`;
      } else if (dateStr.includes('T')) {
        // Si es una fecha ISO completa
        formattedDate = dateStr.split('T')[0];
      } else if (dateStr.includes('-')) {
        // Si ya tiene formato YYYY-MM-DD
        formattedDate = dateStr.split(' ')[0];
      } else {
        // Intentar parsear como año
        const year = parseInt(dateStr);
        if (!isNaN(year) && year > 1000 && year < 3000) {
          formattedDate = `${year}-01-01`;
        }
      }
    }
    
    // Buscar autores en la base de datos y seleccionarlos automáticamente si existen
    if (book.authors && book.authors.length > 0) {
      const foundAuthorIds: string[] = [];
      // Asegurar que los autores sean strings
      const authorNames = book.authors.map((author: string | { name?: string; full_name?: string }) => {
        if (typeof author === 'string') return author;
        if (author && typeof author === 'object') {
          if (author.name) return String(author.name);
          if (author.full_name) return String(author.full_name);
        }
        return String(author || '');
      }).filter((name: string) => name && name.trim() !== '' && name !== '[object Object]');
      
      authorNames.forEach((authorName: string) => {
        // Buscar autor por nombre completo o partes del nombre
        const authorParts = authorName.toLowerCase().split(' ').filter(part => part.length > 0);
        const foundAuthor = authors.find((author) => {
          const authorFullName = author.full_name.toLowerCase();
          // Buscar coincidencia exacta o si el nombre contiene todas las partes
          return authorFullName === authorName.toLowerCase() ||
                 (authorParts.length > 0 && authorParts.every(part => authorFullName.includes(part)));
        });
        if (foundAuthor) {
          foundAuthorIds.push(foundAuthor.author_id);
        }
      });
      
      if (foundAuthorIds.length > 0) {
        setSelectedAuthors(foundAuthorIds);
        setOpenLibraryAuthors([]); // Limpiar mensaje si se encontraron
        console.log('Autores encontrados y seleccionados automáticamente:', foundAuthorIds); // Debug
      } else {
        // Guardar autores para mostrar mensaje
        setOpenLibraryAuthors(book.authors);
        console.log('Autores no encontrados en la base de datos. Se deben crear manualmente:', book.authors); // Debug
      }
    } else {
      setOpenLibraryAuthors([]);
    }
    
    // Autocompletar formulario con datos de Open Library
    setFormData(prev => {
      const updated = {
        ...prev,
        // Siempre actualizar el título si viene
        title: book.title ? book.title : prev.title,
        // Actualizar subtítulo solo si viene (puede ser string vacío)
        subtitle: book.subtitle !== undefined && book.subtitle !== null && book.subtitle !== '' ? book.subtitle : prev.subtitle,
        // Actualizar ISBN solo si viene
        isbn: book.isbn !== undefined && book.isbn !== null && book.isbn !== '' ? book.isbn : prev.isbn,
        // Actualizar descripción solo si viene
        description: book.description !== undefined && book.description !== null && book.description !== '' ? String(book.description) : prev.description,
        // Actualizar fecha solo si se formateó correctamente
        publication_date: formattedDate ? formattedDate : prev.publication_date,
        // Actualizar páginas solo si viene
        page_count: book.page_count !== undefined && book.page_count !== null ? String(book.page_count) : prev.page_count,
        // Actualizar idioma siempre si viene (ya viene mapeado desde openlibrary-search)
        language: book.language && book.language !== '' ? book.language : prev.language,
        // Actualizar portada solo si viene
        cover_image_url: book.cover_image_url && book.cover_image_url !== '' ? book.cover_image_url : prev.cover_image_url,
        // Establecer formato EPUB y estado Disponible cuando se autocompleta desde Open Library
        file_format: 'EPUB',
        status: 'available' as 'available' | 'draft' | 'out_of_stock',
      };
      console.log('Estado actualizado del formulario:', updated); // Debug
      return updated;
    });

    // Si hay portada, actualizar el estado de la imagen
    if (book.cover_image_url) {
      console.log('Actualizando imagen de portada:', book.cover_image_url); // Debug
      setCoverImageUrl(book.cover_image_url);
      // También actualizar en formData para asegurar consistencia
      setFormData(prev => ({ ...prev, cover_image_url: book.cover_image_url || '' }));
    }
    
    // Si hay autores, mostrar mensaje (ya que los autores se seleccionan manualmente)
    if (book.authors && book.authors.length > 0) {
      console.log('Autores encontrados:', book.authors); // Debug
    }
    
    // Si hay editoriales, mostrar mensaje (ya que las editoriales se seleccionan manualmente)
    if (book.publishers && book.publishers.length > 0) {
      console.log('Editoriales encontradas (seleccionar manualmente):', book.publishers); // Debug
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Agregar Nuevo Libro
        </h3>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Libro creado exitosamente
            </p>
          </div>
        )}

        {/* Búsqueda en Open Library */}
        <OpenLibrarySearch onSelectBook={handleOpenLibrarySelect} />

        {/* Portada */}
        <ImageUploader
          label="Portada del libro"
          onUpload={handleImageUpload}
          currentImageUrl={coverImageUrl}
        />

        {/* Título y Subtítulo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="subtitle">Subtítulo</Label>
            <Input
              id="subtitle"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            />
          </div>
        </div>

        {/* ISBN y Idioma */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="isbn">ISBN</Label>
            <Input
              id="isbn"
              value={formData.isbn}
              onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="language">Idioma *</Label>
            <Input
              id="language"
              value={formData.language}
              onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            rows={4}
          />
        </div>

        {/* Fecha de publicación y Editorial */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="publication_date">Fecha de publicación</Label>
            <Input
              id="publication_date"
              type="date"
              value={formData.publication_date}
              onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="publisher_id">Editorial</Label>
            <select
              id="publisher_id"
              value={formData.publisher_id}
              onChange={(e) => setFormData({ ...formData, publisher_id: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="">Seleccionar editorial</option>
              {publishers.map((publisher) => (
                <option key={publisher.publisher_id} value={publisher.publisher_id}>
                  {publisher.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Páginas, Tamaño y Formato */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="page_count">Páginas</Label>
            <Input
              id="page_count"
              type="number"
              value={formData.page_count}
              onChange={(e) => setFormData({ ...formData, page_count: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="file_size">Tamaño (MB)</Label>
            <Input
              id="file_size"
              type="number"
              step="0.01"
              value={formData.file_size}
              onChange={(e) => setFormData({ ...formData, file_size: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="file_format">Formato</Label>
            <select
              id="file_format"
              value={formData.file_format}
              onChange={(e) => setFormData({ ...formData, file_format: e.target.value })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            >
              <option value="PDF">PDF</option>
              <option value="EPUB">EPUB</option>
              <option value="MOBI">MOBI</option>
            </select>
          </div>
        </div>

        {/* URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="sample_url">URL de muestra</Label>
            <Input
              id="sample_url"
              type="url"
              value={formData.sample_url}
              onChange={(e) => setFormData({ ...formData, sample_url: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="full_content_url">URL de contenido completo</Label>
            <Input
              id="full_content_url"
              type="url"
              value={formData.full_content_url}
              onChange={(e) => setFormData({ ...formData, full_content_url: e.target.value })}
            />
          </div>
        </div>

        {/* Precio y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Precio *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="status">Estado *</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as BookStatus })}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
              required
            >
              <option value="available">Disponible</option>
              <option value="draft">Borrador</option>
              <option value="out_of_stock">Agotado</option>
            </select>
          </div>
        </div>

        {/* Destacado */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_featured"
            checked={formData.is_featured}
            onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
            className="w-4 h-4"
          />
          <Label htmlFor="is_featured">Libro destacado</Label>
        </div>

        {/* Autores */}
        <div>
          <Label>Autor Principal *</Label>
          <select
            value={selectedAuthors[0] || ''}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedAuthors([e.target.value]);
                setOpenLibraryAuthors([]); // Limpiar mensaje cuando se selecciona manualmente
              } else {
                setSelectedAuthors([]);
              }
            }}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            required
          >
            <option value="">Seleccionar autor</option>
            {authors.map((author) => (
              <option key={author.author_id} value={author.author_id}>
                {author.full_name}
              </option>
            ))}
          </select>
          {openLibraryAuthors.length > 0 && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                Autores encontrados en Open Library:
              </p>
              <p className="text-blue-700 dark:text-blue-300">
                {openLibraryAuthors.join(', ')}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                ⚠️ Estos autores no están en la base de datos. Debes crearlos primero en la sección &quot;Autores&quot; antes de seleccionarlos.
              </p>
            </div>
          )}
        </div>

        {/* Categorías */}
        <div>
          <Label>Categoría Principal *</Label>
          <select
            value={selectedCategories[0] || ''}
            onChange={(e) => {
              if (e.target.value) {
                setSelectedCategories([e.target.value]);
              } else {
                setSelectedCategories([]);
              }
            }}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            required
          >
            <option value="">Seleccionar categoría</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Libro'}
        </button>
      </div>
    </form>
  );
}

