"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useNavigation } from "@/contexts/NavigationContext";
const AboutModal = dynamic(() => import("@/components/ui/about-modal"), { ssr: false });

export function FooterWithLogo() {
  const [isVisible, setIsVisible] = useState(true);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const pathname = usePathname();
  const { setActiveSection } = useNavigation();
  
  // Detectar si estamos en el panel de admin
  const isAdminPage = pathname?.startsWith('/admin') || false;

  const navItems = [
    { name: "Inicio", link: "/", section: "inicio" },
    { name: "Libros", link: "/#libros", section: "libros" },
    { name: "Autores", link: "/#autores", section: "autores" },
    { name: "Resumen", link: "/#categorias", section: "categorias" },
  ];

  // Detectar si hay modales abiertos
  useEffect(() => {
    const checkForModals = () => {
      // Buscar elementos con aria-modal="true" o role="dialog"
      const modals = document.querySelectorAll('[aria-modal="true"], [role="dialog"]');
      const hasVisibleModal = Array.from(modals).some(modal => {
        const style = window.getComputedStyle(modal);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
      
      return hasVisibleModal;
    };

    // Observar cambios en el DOM para detectar modales
    const observer = new MutationObserver(() => {
      const hasModal = checkForModals();
      const shouldHide = isAdminPage || hasModal;
      
      if (shouldHide) {
        setIsVisible(false);
        // Limpiar timeout si existe
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      }
    });

    // Observar cambios en el body
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-modal', 'role', 'style', 'class'],
    });

    // Verificar inicialmente
    const hasModal = checkForModals();
    const shouldHide = isAdminPage || hasModal;
    if (shouldHide) {
      setIsVisible(false);
    }

    return () => {
      observer.disconnect();
    };
  }, [isAdminPage]);

  useEffect(() => {
    // Si estamos en admin, ocultar el footer inmediatamente
    if (isAdminPage) {
      setIsVisible(false);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // Verificar si hay modales antes de ocultar/mostrar
          const modals = document.querySelectorAll('[aria-modal="true"], [role="dialog"]');
          const hasVisibleModal = Array.from(modals).some(modal => {
            const style = window.getComputedStyle(modal);
            return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
          });
          
          // Si hay modal, no hacer nada (ya está oculto)
          if (hasVisibleModal) {
            ticking = false;
            return;
          }

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
  }, [isAdminPage]);

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
