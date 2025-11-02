'use client';

import { BooksExample } from "@/components/examples/BooksExample";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { useBooks } from "@/hooks";
import { useMemo, useEffect } from "react";
import { transformBooksForParallax } from "@/lib/parallax-books";
import { ThreeDCardDemo } from "@/components/ui/card";
import ExpandableCardDemo from "@/components/expandable-card-demo-standard";
import { useNavigation } from "@/contexts/NavigationContext";
import { Devider } from "@/components/ui/Devider";
import { LoaderOne } from "@/components/ui/loader";

export default function Home() {
  const { books, loading } = useBooks();
  const { activeSection } = useNavigation();

  // Transformar los libros al formato que espera HeroParallax
  const paddedBooks = useMemo(() => {
    return transformBooksForParallax(books, loading);
  }, [books, loading]);

  // Scroll a la sección cuando cambia activeSection
  useEffect(() => {
    if (activeSection === "libros" || activeSection === "autores") {
      const element = document.getElementById(activeSection);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [activeSection]);

  // Renderizar según la sección activa
  const renderContent = () => {
    switch (activeSection) {
      case "libros":
        return (
          <div id="libros" className="min-h-screen py-20">
            <h1 className="text-4xl font-bold mb-8 text-center">Libros</h1>
            <ThreeDCardDemo />
          </div>
        );
      case "autores":
        return (
          <div id="autores" className="min-h-screen py-20">
            <h1 className="text-4xl font-bold mb-8 text-center">Autores</h1>
            <ExpandableCardDemo />
          </div>
        );
      case "categorias":
        return (
          <div id="categorias" className="min-h-screen py-20">
            <h1 className="text-4xl font-bold mb-8 text-center">Categorías</h1>
            <BooksExample />
          </div>
        );
      default: // "inicio"
        return (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-screen">
                <LoaderOne/>
                
              </div>
            ) : paddedBooks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-screen space-y-4 ">
                <p className="text-xl font-semibold">No hay libros disponibles</p>
                <p className="text-gray-600">
                  Agrega libros a tu base de datos con <code className="bg-gray-100 px-2 py-1 rounded">status: &apos;available&apos;</code> y una imagen de portada para verlos aquí.
                </p>
              </div>
            ) : (
              <>
                <HeroParallax products={paddedBooks} />
                <div id="libros" className="py-20 margin-left-4">
                  <Devider title="Libros" />
                  <ThreeDCardDemo />
                </div>
                <Devider title="Autores" />

                <div id="autores" className="py-20">
                  
                  <ExpandableCardDemo />
                </div>
                <Devider title="Resumen" />
                <div id="categorias" className="py-20 bg-gray-100 dark:bg-black border-t border-gray-200 dark:border-gray-800 rounded-t-xl">
                  
                  <BooksExample />
                </div>
              </>
            )}
          </>
        );
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <div className="flex-col min-h-screen w-full md:w-3/4 lg:w-3/4 justify-between py-32 px-16 bg-white dark:bg-black lg:items-start width-full">
        {renderContent()}
      </div>
    </div>
  );
}
