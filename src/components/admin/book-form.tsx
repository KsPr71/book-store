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
    file_format: 'PDF',
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
          file_format: 'PDF',
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

