'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { getAuthorWithBooks } from '@/lib/supabase';
import type { AuthorWithBooks, Book } from '@/types/database';

interface AuthorDetailCardProps {
  author: {
    author_id: string;
    full_name: string;
    biography?: string | null;
    photo_url?: string | null;
    birth_date?: string | null;
    nationality?: string | null;
    website?: string | null;
  };
}

export function AuthorDetailCard({ author }: AuthorDetailCardProps) {
  const [authorDetails, setAuthorDetails] = useState<AuthorWithBooks | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAuthorDetails() {
      try {
        setLoading(true);
        const data = await getAuthorWithBooks(author.author_id);
        if (data) {
          setAuthorDetails(data);
        }
      } catch (error) {
        console.error('Error fetching author details:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAuthorDetails();
  }, [author.author_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-neutral-600 dark:text-neutral-400">Cargando información del autor...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-xl shadow-lg overflow-hidden border border-neutral-200 dark:border-blue-500">
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Foto del autor */}
          <div className="flex-shrink-0">
            {author.photo_url ? (
              <div className="relative h-48 w-48 rounded-lg overflow-hidden shadow-md">
                <Image
                  src={author.photo_url}
                  alt={author.full_name}
                  fill
                  className="object-cover"
                  sizes="192px"
                />
              </div>
            ) : (
              <div className="h-48 w-48 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-md">
                <span className="text-gray-400 dark:text-gray-500">Sin foto</span>
              </div>
            )}
          </div>

          {/* Información del autor */}
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                {author.full_name}
              </h3>
              {author.nationality && (
                <p className="text-neutral-600 dark:text-neutral-400">
                  {author.nationality}
                  {author.birth_date && (
                    <span className="ml-2">
                      ({new Date(author.birth_date).getFullYear()})
                    </span>
                  )}
                </p>
              )}
            </div>

            {/* Biografía */}
            {authorDetails?.biography && (
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
                  Biografía
                </h4>
                <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {authorDetails.biography}
                </p>
              </div>
            )}

            {/* Libros del autor */}
            {authorDetails?.books && authorDetails.books.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-neutral-900 dark:text-white mb-3">
                  Libros de este autor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {authorDetails.books.map((book: Book) => (
                    <a
                      key={book.book_id}
                      href={`/book/${book.book_id}`}
                      className="group p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all duration-200"
                    >
                      <h5 className="font-medium text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        {book.title}
                      </h5>
                      {book.subtitle && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                          {book.subtitle}
                        </p>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Sitio web */}
            {author.website && (
              <div>
                <a
                  href={author.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Sitio web del autor
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

