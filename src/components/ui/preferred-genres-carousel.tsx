"use client";

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Snackbar } from '@/components/ui/snackbar';
import { supabase } from '@/lib/supabase/client';
import { useBooks } from '@/hooks';
import type { BookWithRelations } from '@/types/database';

export default function PreferredGenresCarousel() {
  const { booksWithRelations, loading } = useBooks();
  const [preferredCategoryIds, setPreferredCategoryIds] = React.useState<string[] | null>(null);
  const [loadingProfile, setLoadingProfile] = React.useState(true);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [viewportWidth, setViewportWidth] = React.useState<number>(0);
  const [itemWidth] = React.useState(176); // w-44 = 11rem = 176px

  React.useEffect(() => {
    // Efecto para medir el viewport
    const updateWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    // Medir al montar y en resize
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      setLoadingProfile(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setSnackbarMessage('Para ver recomendaciones personalizadas, inicia sesión y configura tu perfil con tus géneros favoritos.');
        setSnackbarOpen(true);
        if (mounted) setPreferredCategoryIds(null);
        setLoadingProfile(false);
        return;
      }

      try {
        const res = await fetch('/api/profile', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const json = await res.json();
        // Si no hay perfil o no hay géneros configurados, mostrar mensaje
        if (!json.profile?.genres || json.profile.genres.length === 0) {
          setSnackbarMessage('Configura tus géneros favoritos en tu perfil para ver recomendaciones personalizadas.');
          setSnackbarOpen(true);
        }
        if (mounted) {
          setPreferredCategoryIds(json.profile?.genres ?? []);
        }
      } catch (e) {
        console.error('Error loading profile for carousel', e);
        if (mounted) setPreferredCategoryIds(null);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const filteredBooks = React.useMemo(() => {
    if (!preferredCategoryIds || preferredCategoryIds.length === 0) return [];
    const ids = new Set(preferredCategoryIds);
    return booksWithRelations.filter((b) => {
      return (b.categories || []).some((c) => ids.has(c.category_id));
    }).slice(0, 12);
  }, [booksWithRelations, preferredCategoryIds]);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  // Unique id for keyframes to avoid collisions
  const animIdRef = React.useRef<string>(`scrollAnim_${Math.random().toString(36).slice(2, 9)}`);
  const animId = animIdRef.current;

  const scrollBy = (delta: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({ left: delta, behavior: 'smooth' });
  };

  if (loading || loadingProfile) return null;
  if (!preferredCategoryIds || preferredCategoryIds.length === 0) return null;
  if (filteredBooks.length === 0) return null;

  // Calcular ancho del track y padding inicial para centrar
  const trackWidth = Math.min(filteredBooks.length * (itemWidth + 16), viewportWidth - 32); // 16px de gap
  const initialPadding = Math.max(0, (viewportWidth - trackWidth) / 2);

  // Animation duration: base seconds per card
  const durationSeconds = Math.max(10, (filteredBooks.length || 1) * 4);

  return (
    <>
      <section className="w-full my-6 flex flex-col items-center">
      {/* Inline styles for keyframes (unique per instance) */}
      <style>{`
        @keyframes ${animId} {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
        .scroll-track-${animId} {
          display: flex;
          gap: 1rem;
          animation: ${animId} ${durationSeconds}s linear infinite;
          will-change: transform;
          mask-image: linear-gradient(
            to right,
            transparent,
            black 10%,
            black 90%,
            transparent
          );
          -webkit-mask-image: linear-gradient(
            to right,
            transparent,
            black 10%,
            black 90%,
            transparent
          );
        }
        .scroll-track-${animId}:hover {
          animation-play-state: paused;
        }
      `}</style>
      <div className="w-full max-w-screen-xl mx-auto flex items-center justify-between mb-3 px-4">
        <h3 className="text-xl font-semibold">Recomendados para ti</h3>
        <div className="flex gap-2">
          <button
            aria-label="Anterior"
            onClick={() => scrollBy(-300)}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-800"
          >◀</button>
          <button
            aria-label="Siguiente"
            onClick={() => scrollBy(300)}
            className="px-3 py-1 rounded bg-gray-200 dark:bg-neutral-800"
          >▶</button>
        </div>
      </div>

      <div className="w-full max-w-screen-xl mx-auto px-4">
        <div
          ref={containerRef}
          className="w-full overflow-hidden py-2 relative"
          aria-roledescription="carousel"
        >
          {/* Gradientes para el desvanecido */}
          <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white via-white to-transparent dark:from-neutral-950 dark:via-neutral-950 z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white via-white to-transparent dark:from-neutral-950 dark:via-neutral-950 z-10"></div>
          <div 
            className={`scroll-track-${animId} items-center`} 
            style={{ 
              minWidth: 'max-content', 
              alignItems: 'center',
              paddingLeft: `${initialPadding}px`,
              paddingRight: `${initialPadding}px`,
            }}
          >
            {[...filteredBooks, ...filteredBooks].map((book: BookWithRelations, idx) => {
            const mainAuthor = book.authors?.find(a => a.role === 'main_author') || book.authors?.[0];
            return (
              <article
                key={`${book.book_id}_${idx}`}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/book/${book.book_id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/book/${book.book_id}`); }}
                onMouseEnter={() => {
                  // prefetch the book page for faster navigation
                  try { router.prefetch?.(`/book/${book.book_id}`); } catch { /* ignore */ }
                }}
                className="w-44 flex-shrink-0 bg-white dark:bg-neutral-900 border rounded-lg p-2 shadow-sm cursor-pointer focus:ring-2 focus:ring-green-400 transition-transform duration-200 hover:translate-y-[-2px] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(72,187,120,0.12)]"
                style={{ scrollSnapAlign: 'start' }}
              >
                <div className="w-full h-56 relative rounded-md overflow-hidden bg-gray-100">
                  {book.cover_image_url ? (
                    <Image src={book.cover_image_url} alt={book.title} fill className="object-cover" sizes="176px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">Sin portada</div>
                  )}
                </div>
                <h4 className="text-sm font-semibold mt-2 line-clamp-2">{book.title}</h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 line-clamp-1">{mainAuthor?.full_name ?? '—'}</p>
              </article>
            );
          })}
          </div>
        </div>
      </div>
    </section>
    <Snackbar
      message={snackbarMessage}
      type="info"
      isOpen={snackbarOpen}
      onClose={() => setSnackbarOpen(false)}
      duration={6000}
    />
    </>
  );
}
