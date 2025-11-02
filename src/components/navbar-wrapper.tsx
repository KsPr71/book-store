"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar, NavBody, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle } from "@/components/ui/resizable-navbar";

export function NavbarWrapper() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const { setActiveSection } = useNavigation();
  const { user, logout } = useAuth();

  const navItems = [
    { name: "Inicio", link: "/", section: "inicio" },
    { name: "Libros disponibles", link: "/#libros", section: "libros" },
    { name: "Autores", link: "/#autores", section: "autores" },
    { name: "Categorías", link: "/#categorias", section: "categorias" },
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
          {user && (
            <button
              onClick={async () => {
                await logout();
                window.location.href = '/';
              }}
              className="relative px-4 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-4"
            >
              Cerrar sesión
            </button>
          )}
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
          {user ? (
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
          ) : (
            <Link
              href="/login"
              className="block px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Iniciar sesión
            </Link>
          )}
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  );
}

