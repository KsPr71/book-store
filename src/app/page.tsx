'use client';

import { BooksExample } from "@/components/examples/BooksExample";
import { HeroParallax } from "@/components/ui/hero-parallax";
import { useBooks } from "@/hooks";
import { useMemo, useEffect } from "react";
import { transformBooksForParallax } from "@/lib/parallax-books";
import { ThreeDCardDemo } from "@/components/ui/card";
import PreferredGenresCarousel from '@/components/ui/preferred-genres-carousel';
import ExpandableCardDemo from "@/components/expandable-card-demo-standard";
import { useNavigation } from "@/contexts/NavigationContext";
import { Devider } from "@/components/ui/Devider";
import { LoaderOne } from "@/components/ui/loader";
import { DefaultAccordion } from "@/components/ui/CustomAccordion";
import { LayoutTextFlip } from "@/components/ui/layout-text-flip";
import { useCategories } from "@/hooks";
export default function Home() {
  const { books, loading } = useBooks();
  const { activeSection } = useNavigation();

  // Transformar los libros al formato que espera HeroParallax
  const paddedBooks = useMemo(() => {
    return transformBooksForParallax(books, loading);
  }, [books, loading]);

  const {categories} = useCategories()

  const categoryNamesArray = useMemo(() => {
    return categories?.map(cat => cat.category_name) || [];
  }, [categories]);

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
            <PreferredGenresCarousel />
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
            <h1 className="text-4xl font-bold mb-8 text-center">Resumen</h1>
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
                <div id="libros" className="py-10  w-full max-w-none ">
                <div className="dark:bg-black rounded-t-xl w-full max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg xl:max-w-screen-xl 2xl:max-w-screen-2xl mx-auto flex justify-center items-center">
                    <LayoutTextFlip
                      text="Descubre la mejor literatura de los géneros: "
                      words={categoryNamesArray}
                      duration={3000}
                    />
                  </div>
                  <PreferredGenresCarousel />
                  <Devider title="Libros" />
                  <ThreeDCardDemo />
                </div>
                <Devider title="Autores" />


                <div id="autores" className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 rounded-t-xl w-full">
                  <DefaultAccordion/>
                </div>
                <Devider title="Resumen" />
                <div id="categorias" className="py-5 bg-gray-50 dark:bg-black border-t border-gray-200 dark:border-gray-800 rounded-t-xl w-full">
                  
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
      <div className="flex-col min-h-screen w-full justify-between py-32 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 bg-white dark:bg-black lg:items-start">
        {renderContent()}
      </div>
    </div>
  );
}
