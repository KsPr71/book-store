'use client';

import { BooksExample } from "@/components/examples/BooksExample";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { useBooks } from "@/hooks";
import { useMemo } from "react";
import { transformBooksForParallax } from "@/lib/parallax-books";
import { ThreeDCardDemo } from "@/components/ui/card";
import ExpandableCardDemo from "@/components/expandable-card-demo-standard";

export default function Home() {
  const { books, loading } = useBooks();

  // Transformar los libros al formato que espera HeroParallax
  const paddedBooks = useMemo(() => {
    return transformBooksForParallax(books, loading);
  }, [books, loading]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex-col min-h-screen w-full md:w-3/4 lg:w-3/4 justify-between py-32 px-16 bg-white dark:bg-black lg:items-start width-full">
        {loading ? (
          <div className="flex items-center justify-center h-screen">
            <p className="text-lg">Cargando libros...</p>
          </div>
        ) : paddedBooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-screen space-y-4">
            <p className="text-xl font-semibold">No hay libros disponibles</p>
            <p className="text-gray-600">
              Agrega libros a tu base de datos con <code className="bg-gray-100 px-2 py-1 rounded">status: &apos;available&apos;</code> y una imagen de portada para verlos aquí.
            </p>
          </div>
        ) : (
          <>
            <HeroParallax products={paddedBooks} />
            <ThreeDCardDemo/>
            <ExpandableCardDemo/>
           
            <BooksExample />
          </>
        )}
      </div>
    </div>
  );
}
