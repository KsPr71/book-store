'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type {
  Book,
  BookWithRelations,
  Author,
  Category,
  CategoryWithBooks,
  Publisher,
} from '@/types/database';
import {
  getAllBooks,
  getBooksWithRelations,
  getFeaturedBooks,
  getAllAuthors,
  getAllCategories,
  getMainCategories,
  getAllPublishers,
} from '@/lib/supabase';

interface BookStoreContextType {
  // Estados de datos
  books: Book[];
  booksWithRelations: BookWithRelations[];
  featuredBooks: Book[];
  authors: Author[];
  categories: Category[];
  mainCategories: Category[];
  publishers: Publisher[];

  // Estados de carga
  loading: boolean;
  loadingBooks: boolean;
  loadingAuthors: boolean;
  loadingCategories: boolean;

  // Funciones de recarga
  refreshBooks: () => Promise<void>;
  refreshAuthors: () => Promise<void>;
  refreshCategories: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const BookStoreContext = createContext<BookStoreContextType | undefined>(undefined);

export function BookStoreProvider({ children }: { children: React.ReactNode }) {
  // Estados de datos
  const [books, setBooks] = useState<Book[]>([]);
  const [booksWithRelations, setBooksWithRelations] = useState<BookWithRelations[]>([]);
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mainCategories, setMainCategories] = useState<Category[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);

  // Estados de carga
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingAuthors, setLoadingAuthors] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Función para cargar libros
  const refreshBooks = useCallback(async () => {
    try {
      setLoadingBooks(true);
      const [allBooks, booksRelations, featured] = await Promise.all([
        getAllBooks(),
        getBooksWithRelations(),
        getFeaturedBooks(),
      ]);
      setBooks(allBooks);
      setBooksWithRelations(booksRelations);
      setFeaturedBooks(featured);
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  // Función para cargar autores
  const refreshAuthors = useCallback(async () => {
    try {
      setLoadingAuthors(true);
      const allAuthors = await getAllAuthors();
      setAuthors(allAuthors);
    } catch (error) {
      console.error('Error loading authors:', error);
    } finally {
      setLoadingAuthors(false);
    }
  }, []);

  // Función para cargar categorías
  const refreshCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const [allCategories, mainCats] = await Promise.all([
        getAllCategories(),
        getMainCategories(),
      ]);
      setCategories(allCategories);
      setMainCategories(mainCats);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // Función para cargar editores
  const refreshPublishers = useCallback(async () => {
    try {
      const allPublishers = await getAllPublishers();
      setPublishers(allPublishers);
    } catch (error) {
      console.error('Error loading publishers:', error);
    }
  }, []);

  // Función para recargar todo
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshBooks(),
      refreshAuthors(),
      refreshCategories(),
      refreshPublishers(),
    ]);
  }, [refreshBooks, refreshAuthors, refreshCategories, refreshPublishers]);

  // Cargar datos al montar el componente
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value: BookStoreContextType = {
    books,
    booksWithRelations,
    featuredBooks,
    authors,
    categories,
    mainCategories,
    publishers,
    loading: loadingBooks || loadingAuthors || loadingCategories,
    loadingBooks,
    loadingAuthors,
    loadingCategories,
    refreshBooks,
    refreshAuthors,
    refreshCategories,
    refreshAll,
  };

  return (
    <BookStoreContext.Provider value={value}>
      {children}
    </BookStoreContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useBookStore() {
  const context = useContext(BookStoreContext);
  if (context === undefined) {
    throw new Error('useBookStore must be used within a BookStoreProvider');
  }
  return context;
}

