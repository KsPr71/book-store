"use client";

import React, { useEffect, useId, useRef, useState, useMemo } from "react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { useAuthors } from "@/hooks";
import { getAuthorWithBooks } from "@/lib/supabase";
import type { AuthorWithBooks, Book } from "@/types/database";

// Tipo para las cards de autores
type AuthorCard = {
  author_id: string;
  title: string;
  description: string;
  src: string;
  ctaText: string;
  ctaLink: string;
  content: string | (() => React.ReactNode);
};

export default function ExpandableCardDemo() {
  const { authors, loading } = useAuthors();
  const [active, setActive] = useState<AuthorCard | boolean | null>(null);
  const [authorDetails, setAuthorDetails] = useState<AuthorWithBooks | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const id = useId();

  // Transformar autores al formato que espera el componente
  const authorCards = useMemo((): AuthorCard[] => {
    return authors.map((author) => ({
      author_id: author.author_id,
      title: author.full_name,
      description: author.nationality || "Autor",
      src: author.photo_url || "/placeholder-author.jpg",
      ctaText: "Ver Libros",
      ctaLink: author.website || `/author/${author.author_id}`,
      content: author.biography || "No hay biografía disponible para este autor.",
    }));
  }, [authors]);

  // Cargar detalles del autor cuando se selecciona uno
  useEffect(() => {
    if (active && typeof active === "object" && active.author_id) {
      getAuthorWithBooks(active.author_id).then((data) => {
        if (data) {
          setAuthorDetails(data);
        }
      });
    }
  }, [active]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 h-full w-full z-10"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div className="fixed inset-0  grid place-items-center z-[100]">
            <motion.button
              key={`button-${active.title}-${id}`}
              layout
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
                transition: {
                  duration: 0.05,
                },
              }}
              className="flex absolute top-2 right-2 lg:hidden items-center justify-center bg-white rounded-full h-6 w-6"
              onClick={() => setActive(null)}
            >
              <CloseIcon />
            </motion.button>
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[500px]  h-full md:h-fit md:max-h-[90%]  flex flex-col bg-white dark:bg-neutral-900 sm:rounded-3xl overflow-hidden"
            >
              <motion.div layoutId={`image-${active.title}-${id}`}>
                {active.src ? (
                  <div className="relative w-full h-80 lg:h-80">
                    <Image
                      src={active.src}
                      alt={active.title}
                      fill
                      className="object-cover object-top sm:rounded-tr-lg sm:rounded-tl-lg"
                      sizes="(max-width: 768px) 100vw, 500px"
                    />
                  </div>
                ) : (
                  <div className="w-full h-80 lg:h-80 bg-gray-200 dark:bg-gray-700 flex items-center justify-center sm:rounded-tr-lg sm:rounded-tl-lg">
                    <span className="text-gray-400 dark:text-gray-500">Sin foto</span>
                  </div>
                )}
              </motion.div>

              <div>
                <div className="flex justify-between items-start p-4">
                  <div className="">
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-bold text-neutral-700 dark:text-neutral-200"
                    >
                      {active.title}
                    </motion.h3>
                    <motion.p
                      layoutId={`description-${active.description}-${id}`}
                      className="text-neutral-600 dark:text-neutral-400"
                    >
                      {active.description}
                      {authorDetails?.birth_date && (
                        <span className="ml-2 text-xs">
                          ({new Date(authorDetails.birth_date).getFullYear()})
                        </span>
                      )}
                    </motion.p>
                  </div>

                  <motion.button
                    layoutId={`button-${active.title}-${id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const booksSection = scrollContainerRef.current?.querySelector('[data-books-section]') as HTMLElement;
                      
                      if (booksSection && scrollContainerRef.current) {
                        // Calcular la posición relativa dentro del contenedor scrollable
                        const scrollContainer = scrollContainerRef.current;
                        const sectionOffset = booksSection.offsetTop - scrollContainer.offsetTop + scrollContainer.scrollTop;
                        
                        scrollContainer.scrollTo({
                          top: sectionOffset - 30, // 30px de padding superior
                          behavior: 'smooth'
                        });
                      }
                    }}
                    className="px-4 py-3 text-sm rounded-full font-bold bg-green-500 text-white hover:bg-green-600 transition-colors cursor-pointer"
                  >
                    {active.ctaText}
                  </motion.button>
                </div>
                <div className="pt-4 relative px-4">
                  <motion.div
                    ref={scrollContainerRef}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-neutral-600 text-xs md:text-sm lg:text-base h-40 md:h-fit pb-10 flex flex-col items-start gap-4 overflow-auto dark:text-neutral-400 [mask:linear-gradient(to_bottom,white,white,transparent)] [scrollbar-width:none] [-ms-overflow-style:none] [-webkit-overflow-scrolling:touch]"
                  >
                    {authorDetails?.books && authorDetails.books.length > 0 ? (
                      <div>
                        <p className="mb-4">{typeof active.content === "function" ? active.content() : active.content}</p>
                        <div className="mt-4" data-books-section>
                          <h4 className="font-semibold mb-3 text-lg text-neutral-800 dark:text-neutral-200">Libros de este autor:</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {authorDetails.books.map((book: Book) => (
                              <a
                                key={book.book_id}
                                href={`/book/${book.book_id}`}
                                className="block p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-green-500 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <h5 className="font-medium text-neutral-900 dark:text-neutral-100 hover:text-green-600 dark:hover:text-green-400 transition-colors line-clamp-2">
                                  {book.title}
                                </h5>
                                {book.subtitle && (
                                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-1">
                                    {book.subtitle}
                                  </p>
                                )}
                                {book.price > 0 && (
                                  <p className="text-sm font-semibold text-green-600 dark:text-green-400 mt-2">
                                    ${book.price.toFixed(2)}
                                  </p>
                                )}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="mb-4">{typeof active.content === "function" ? active.content() : active.content}</p>
                        <div data-books-section className="mt-4 p-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 text-center">
                            Este autor aún no tiene libros disponibles.
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando autores...</p>
        </div>
      ) : authorCards.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <p className="text-lg text-neutral-600 dark:text-neutral-400">No hay autores disponibles</p>
        </div>
      ) : (
        <ul className="max-w-2xl mx-auto w-full gap-4">
          {authorCards.map((card) => (
            <motion.div
              layoutId={`card-${card.title}-${id}`}
              key={`card-${card.author_id}-${id}`}
              onClick={() => setActive(card)}
              className="p-4 flex flex-col md:flex-row justify-between items-center hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-xl cursor-pointer"
            >
              <div className="flex gap-4 flex-col md:flex-row ">
                <motion.div layoutId={`image-${card.title}-${id}`}>
                  {card.src ? (
                    <div className="relative h-40 w-40 md:h-14 md:w-14 rounded-lg overflow-hidden">
                      <Image
                        src={card.src}
                        alt={card.title}
                        fill
                        className="object-cover object-top"
                        sizes="(max-width: 768px) 160px, 56px"
                      />
                    </div>
                  ) : (
                    <div className="h-40 w-40 md:h-14 md:w-14 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-gray-400 dark:text-gray-500 text-xs">Sin foto</span>
                    </div>
                  )}
                </motion.div>
                <div className="">
                  <motion.h3
                    layoutId={`title-${card.title}-${id}`}
                    className="font-medium text-neutral-800 dark:text-neutral-200 text-center md:text-left"
                  >
                    {card.title}
                  </motion.h3>
                  <motion.p
                    layoutId={`description-${card.description}-${id}`}
                    className="text-neutral-600 dark:text-neutral-400 text-center md:text-left"
                  >
                    {card.description}
                  </motion.p>
                </div>
              </div>
              <motion.button
                layoutId={`button-${card.title}-${id}`}
                className="px-4 py-2 text-sm rounded-full font-bold bg-gray-100 hover:bg-green-500 hover:text-white text-black mt-4 md:mt-0"
              >
                {card.ctaText}
              </motion.button>
            </motion.div>
          ))}
        </ul>
      )}
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
        transition: {
          duration: 0.05,
        },
      }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 text-black"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};

