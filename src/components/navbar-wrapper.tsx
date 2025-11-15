"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { useNavigation } from "@/contexts/NavigationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { Navbar, NavBody, MobileNav, MobileNavHeader, MobileNavMenu, MobileNavToggle } from "@/components/ui/resizable-navbar";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Settings, User, Package, LogOut } from "lucide-react";
import dynamic from "next/dynamic";
const AboutModal = dynamic(() => import("@/components/ui/about-modal"), { ssr: false });
const SettingsModal = dynamic(() => import("@/components/ui/settings-modal").then(mod => ({ default: mod.SettingsModal })), { ssr: false });
const CartModal = dynamic(() => import("@/components/cart-modal").then(mod => ({ default: mod.CartModal })), { ssr: false });

export function NavbarWrapper() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);
  const { setActiveSection } = useNavigation();
  const { user, logout } = useAuth();
  const { getTotalItems } = useCart();
  const isAdminUser = user ? checkIsAdmin(user.email) : false;
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cartItemCount = getTotalItems();

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
                <div className="absolute right-0 mt-2 w-40 rounded-md bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 border border-gray-200 dark:border-blue-500 shadow-lg z-50">
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      // Ir a perfil (ruta de ejemplo)
                      window.location.href = '/profile';
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-t-md transition-colors flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      window.location.href = '/orders';
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 border-t border-gray-200 dark:border-neutral-700 transition-colors flex items-center gap-2"
                  >
                    <Package className="w-4 h-4" />
                    Mis Pedidos
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 border-t border-gray-200 dark:border-neutral-700 transition-colors flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Configuración
                  </button>
                  <button
                    onClick={async () => {
                      setUserMenuOpen(false);
                      await logout();
                      window.location.href = '/';
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-gray-100 dark:hover:bg-neutral-700 rounded-b-md border-t border-gray-200 dark:border-neutral-700 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          )}
          {user && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-3 py-2 text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors ml-4 flex items-center justify-center"
              aria-label="Carrito"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          )}
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
              <button
                onClick={() => {
                  setIsCartOpen(true);
                  setIsMobileMenuOpen(false);
                }}
                className="relative flex items-center justify-center w-full px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
                aria-label="Carrito"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </button>
              <Link
                href="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                Perfil
              </Link>
              <Link
                href="/orders"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              >
                <Package className="w-4 h-4" />
                Mis Pedidos
              </Link>
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
                onClick={async () => {
                  await logout();
                  setIsMobileMenuOpen(false);
                  window.location.href = '/';
                }}
                className="flex items-center gap-2 w-full text-left px-4 py-2 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
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
      {user && <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
    </Navbar>
  );
}

