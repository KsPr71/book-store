'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';
import { updateBook, associateAuthorWithBook, associateCategoryWithBook, removeAllAuthorAssociations, removeAllCategoryAssociations } from '@/lib/supabase/admin-books';
import { uploadBookCover } from '@/lib/supabase/storage';
import { getAllAuthors } from '@/lib/supabase/authors';
import { getAllCategories } from '@/lib/supabase/categories';
import { getAllPublishers } from '@/lib/supabase/publishers';
import type { Author, Category, Publisher, BookStatus, BookWithRelations } from '@/types/database';
import { useBooks } from '@/hooks';

interface BookEditFormProps {
  book: BookWithRelations;
  onClose: () => void;
}

export function BookEditForm({ book, onClose }: BookEditFormProps) {
  const { refreshBooks } = useBooks();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    title: book.title,
    subtitle: book.subtitle || '',
    isbn: book.isbn || '',
    description: book.description || '',
    publication_date: book.publication_date ? book.publication_date.split('T')[0] : '',
    publisher_id: book.publisher_id || '',
    language: book.language,
    page_count: book.page_count?.toString() || '',
    file_size: book.file_size?.toString() || '',
    file_format: book.file_format || 'PDF',
    cover_image_url: book.cover_image_url || '',
    sample_url: book.sample_url || '',
    full_content_url: book.full_content_url || '',
    price: book.price.toString(),
    is_featured: book.is_featured,
    status: book.status,
  });

  const [selectedAuthor, setSelectedAuthor] = useState<string>(
    (book.authors && book.authors.length > 0 ? book.authors[0].author_id : '') || ''
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    (book.categories && book.categories.length > 0 ? book.categories[0].category_id : '') || ''
  );
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(book.cover_image_url || null);

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
    const tempId = `temp-${Date.now()}`;
    const result = await uploadBookCover(tempId, file);

    if (result.url) {
      // Remover el parámetro de cache-busting antes de guardar en la BD
      // El parámetro t= solo se usa para visualización, no para almacenar
      const cleanUrl = result.url.split('?')[0];
      setCoverImageUrl(cleanUrl);
      setFormData({ ...formData, cover_image_url: cleanUrl });
      console.log('✅ URL de imagen guardada en formData (sin cache-busting):', cleanUrl);
      console.log('📸 URL con cache-busting para preview:', result.url);
    } else {
      const errorMsg = result.error || 'Error al subir la imagen';
      console.error('❌ Error al subir imagen:', errorMsg);
      setError(errorMsg);
      // No lanzar error aquí, dejar que ImageUploader lo maneje
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Actualizar el libro
      const bookResult = await updateBook(book.book_id, {
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
        setError(bookResult.error || 'Error al actualizar el libro');
        setLoading(false);
        return;
      }

      // Actualizar asociaciones si cambiaron
      const currentAuthorId = book.authors && book.authors.length > 0 ? book.authors[0].author_id : null;
      const currentCategoryId = book.categories && book.categories.length > 0 ? book.categories[0].category_id : null;

      // Actualizar autor si cambió
      if (selectedAuthor !== currentAuthorId) {
        await removeAllAuthorAssociations(book.book_id);
        if (selectedAuthor) {
          await associateAuthorWithBook(book.book_id, selectedAuthor, 'main_author');
        }
      }

      // Actualizar categoría si cambió
      if (selectedCategory !== currentCategoryId) {
        await removeAllCategoryAssociations(book.book_id);
        if (selectedCategory) {
          await associateCategoryWithBook(book.book_id, selectedCategory);
        }
      }

      setSuccess(true);
      refreshBooks();
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Libro actualizado exitosamente
            </p>
          </div>
        )}

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

        {/* Autor */}
        <div>
          <Label>Autor Principal *</Label>
          <select
            value={selectedAuthor}
            onChange={(e) => setSelectedAuthor(e.target.value)}
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
        </div>

        {/* Categoría */}
        <div>
          <Label>Categoría Principal *</Label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
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

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-medium rounded-lg hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </form>
  );
}

