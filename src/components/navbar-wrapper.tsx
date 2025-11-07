"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { Navbar, NavBody, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle } from "@/components/ui/resizable-navbar";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Settings } from "lucide-react";
import dynamic from "next/dynamic";
const AboutModal = dynamic(() => import("@/components/ui/about-modal"), { ssr: false });
const SettingsModal = dynamic(() => import("@/components/ui/settings-modal").then(mod => ({ default: mod.SettingsModal })), { ssr: false });

export function NavbarWrapper() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const { setActiveSection } = useNavigation();
  const { user, logout } = useAuth();
  const isAdminUser = user ? checkIsAdmin(user.email) : false;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar el menú del usuario al hacer click fuera
  useOutsideClick(userMenuRef, () => {
    setUserMenuOpen(false);
  });

  const navItems = [
    { name: "Inicio", link: "/", section: "inicio" },
    { name: "Libros disponibles", link: "/#libros", section: "libros" },
    { name: "Autores", link: "/#autores", section: "autores" },
    { name: "Resumen", link: "/#categorias", section: "categorias" },
  ];

  return (
    <Navbar>
      <NavBody>
        <Link 
          href="/" 
          onClick={() => setActiveSection("inicio")}
          className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black dark:text-white"
        >
          <span className="font-medium text-black dark:text-white">Click & Read</span>
        </Link>
        <motion.div 
          onMouseLeave={() => setHoveredItem(null)}
          className="absolute inset-0 hidden flex-1 flex-row items-center justify-center space-x-2 text-sm font-medium text-zinc-600 transition duration-200 hover:text-zinc-800 lg:flex lg:space-x-2"
        >
          {navItems.map((item, idx) => (
            <Link
              key={`link-${idx}`}
              href={item.link}
              onMouseEnter={() => setHoveredItem(idx)}
              onClick={() => {
                setActiveSection(item.section as "inicio" | "libros" | "autores" | "categorias");
                setIsMobileMenuOpen(false);
              }}
              className="relative px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors duration-200"
            >
              {hoveredItem === idx && (
                <motion.div
                  layoutId="hovered-nav-item"
                  className="absolute inset-0 h-full w-full rounded-full bg-gray-100 dark:bg-neutral-800"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
              <span className="relative z-20">{item.name}</span>
            </Link>
          ))}
          {isAdminUser && (
            <Link
              href="/admin"
              className="relative px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors ml-4 font-medium"
            >
              Admin
            </Link>
          )}
          {user && (
            <div className="relative ml-4" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="relative px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors rounded-md whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
              >
                {`Usuario: ${user.user_metadata?.first_name ?? ''}${user.user_metadata?.last_name ? ' ' + user.user_metadata.last_name : ''}`}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-lg z-50">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Ir a perfil (ruta de ejemplo)
                      window.location.href = '/profile';
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-t-md"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                      window.location.href = '/';
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-b-md border-t border-gray-200 dark:border-neutral-800"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="relative px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-4 flex items-center gap-2"
            aria-label="Configuración"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Configuración</span>
          </button>
          <button
            onClick={() => setIsAboutOpen(true)}
            className="relative px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-4"
          >
            Acerca
          </button>
          {!user && (
            <Link
              href="/login"
              className="relative px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-4"
            >
              Iniciar sesión
            </Link>
          )}
        </motion.div>
      </NavBody>
      <MobileNav>
        <MobileNavHeader>
          <Link 
            href="/" 
            onClick={() => setActiveSection("inicio")}
            className="relative z-20 mr-4 flex items-center space-x-2 px-2 py-1 text-sm font-normal text-black dark:text-white"
          >
            <span className="font-medium text-black dark:text-white">Click & Read</span>
          </Link>
          <MobileNavToggle 
            isOpen={isMobileMenuOpen} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          />
        </MobileNavHeader>
        <MobileNavMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)}
        >
          {user && (
            <div className="px-4 py-2 border-b border-gray-100 dark:border-neutral-800 mb-2">
              <p className="text-sm text-neutral-700 dark:text-neutral-300">{`Usuario: ${user.user_metadata?.first_name ?? ''}${user.user_metadata?.last_name ? ' ' + user.user_metadata.last_name : ''}`}</p>
            </div>
          )}
          {navItems.map((item) => (
            <Link
              key={item.section}
              href={item.link}
              className="block px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              onClick={() => {
                setActiveSection(item.section as "inicio" | "libros" | "autores" | "categorias");
                setIsMobileMenuOpen(false);
              }}
            >
              {item.name}
            </Link>
          ))}
          {isAdminUser && (
            <Link
              href="/admin"
              className="block px-4 py-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200 font-medium"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Admin
            </Link>
          )}
          {user ? (
            <>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              >
                Perfil
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  setIsMobileMenuOpen(false);
                  window.location.href = '/';
                }}
                className="block w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <div className="flex flex-col w-full">
              <Link
                href="/login"
                className="block px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Iniciar sesión
              </Link>
              <Link
                href="/signup"
                className="mt-2 block px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Crear cuenta
              </Link>
            </div>
          )}
          <button
            onClick={() => {
              setIsSettingsOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center gap-2 w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
          >
            <Settings className="w-4 h-4" />
            Configuración
          </button>
          <button
            onClick={() => {
              setIsAboutOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
          >
            Acerca
          </button>
        </MobileNavMenu>
      </MobileNav>
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </Navbar>
  );
}

