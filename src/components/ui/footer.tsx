"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { useNavigation } from "@/contexts/NavigationContext";
const AboutModal = dynamic(() => import("@/components/ui/about-modal"), { ssr: false });

export function FooterWithLogo() {
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const { setActiveSection } = useNavigation();

  const navItems = [
    { name: "Inicio", link: "/", section: "inicio" },
    { name: "Libros", link: "/#libros", section: "libros" },
    { name: "Autores", link: "/#autores", section: "autores" },
    { name: "Resumen", link: "/#categorias", section: "categorias" },
  ];

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Si hay scroll, ocultar el footer
          setIsVisible(false);
          
          // Limpiar timeout anterior si existe
          if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
          }

          // Mostrar el footer después de 1 segundo sin scroll
          scrollTimeoutRef.current = setTimeout(() => {
            setIsVisible(true);
          }, 1000);

          ticking = false;
        });

        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.footer
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-lg border-t border-gray-200/30 dark:border-gray-800/30"
          >
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                {/* Logo */}
                <div className="flex items-center mb-4 md:mb-0">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    <Image
                      alt="logo"
                      src="/logo2.svg"
                      width={80}
                      height={80}
                      className="dark:invert"
                    />
                  </div>
                </div>

                {/* Links */}
                <div className="flex space-x-6 items-center">
                  {navItems.map((item) => (
                    <Link
                      key={item.section}
                      href={item.link}
                      onClick={() => {
                        setActiveSection(item.section as "inicio" | "libros" | "autores" | "categorias");
                      }}
                      className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}

                  <button
                    onClick={() => setIsAboutOpen(true)}
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Acerca
                  </button>
                </div>

                {/* Copyright */}
                <div className="mt-4 md:mt-0">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    © {new Date().getFullYear()} Click & Read. Todos los derechos reservados.
                  </p>
                </div>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>

      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
    </>
  );
}
