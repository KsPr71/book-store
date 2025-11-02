'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookById } from '@/lib/supabase';
import type { BookWithRelations } from '@/types/database';
import Image from 'next/image';
import Link from 'next/link';
import { BookDetailCard } from '@/components/book-detail-card';
import { AuthorDetailCard } from '@/components/author-detail-card';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params?.id as string;
  const [book, setBook] = useState<BookWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookId) {
      setError('ID de libro no válido');
      setLoading(false);
      return;
    }

    async function fetchBook() {
      try {
        setLoading(true);
        const bookData = await getBookById(bookId);
        if (!bookData) {
          setError('Libro no encontrado');
        } else {
          setBook(bookData);
        }
      } catch (err) {
        console.error('Error fetching book:', err);
        setError('Error al cargar el libro');
      } finally {
        setLoading(false);
      }
    }

    fetchBook();
  }, [bookId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando libro...</p>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black gap-4">
        <p className="text-xl font-semibold text-neutral-800 dark:text-white">{error || 'Libro no encontrado'}</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  // Obtener el autor principal
  const mainAuthor = book.authors?.find(author => author.role === 'main_author') || book.authors?.[0];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Botón de volver */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 mb-6 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Volver
        </Link>

        {/* Card de detalle del libro */}
        <BookDetailCard book={book} />

        {/* Card del autor si existe */}
        {mainAuthor && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-neutral-800 dark:text-white">Sobre el autor</h2>
            <AuthorDetailCard author={mainAuthor} />
          </div>
        )}
      </div>
    </div>
  );
}

