"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Section = "inicio" | "libros" | "autores" | "categorias";

interface NavigationContextType {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(
  undefined
);

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeSection, setActiveSection] = useState<Section>("inicio");

  // Detectar cambios en el hash de la URL
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remover el #
      if (hash === "libros") {
        setActiveSection("libros");
      } else if (hash === "autores") {
        setActiveSection("autores");
      } else if (hash === "categorias") {
        setActiveSection("categorias");
      } else {
        setActiveSection("inicio");
      }
    };

    // Verificar el hash inicial
    handleHashChange();

    // Escuchar cambios en el hash
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <NavigationContext.Provider value={{ activeSection, setActiveSection }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider");
  }
  return context;
}

