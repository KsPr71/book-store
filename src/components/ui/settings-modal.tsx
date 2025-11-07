"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ThemeSwitch } from "./theme-switch";
import { useTheme } from "next-themes";
import { useCardSize } from "@/contexts/CardSizeContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: Props) {
  const { theme } = useTheme();
  const { cardSize, setCardSize } = useCardSize();

  useEffect(() => {
    // Evitar scroll del body cuando el modal está abierto
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
    return;
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          {/* Overlay */}
          <motion.div
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black"
          />

          {/* Modal panel */}
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 10, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 mx-4 max-w-md w-full rounded-lg bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 p-6 shadow-lg border-2 border-blue-400 dark:border-gray-800"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Configuración
              </h2>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Cerrar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Configuración de Tema */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                <div className="flex flex-col">
                  <span className="text-lg font-medium text-gray-900 dark:text-white">
                    Modo Oscuro
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {theme === "dark" 
                      ? "Activa el modo claro" 
                      : "Activa el modo oscuro"}
                  </span>
                </div>
                <ThemeSwitch />
              </div>

              {/* Configuración de Tamaño de Cards */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-lg font-medium text-gray-900 dark:text-white">
                      Tamaño de Tarjetas
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Ajusta el ancho de las tarjetas de libros
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 min-w-[3.5rem] text-right">
                    {cardSize.toFixed(1)}rem
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Ancho:
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="28"
                    step="0.5"
                    value={cardSize}
                    onChange={(e) => setCardSize(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-600 transition-colors"
                    style={{
                      background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((cardSize - 10) / (28 - 10)) * 100}%, #e5e7eb ${((cardSize - 10) / (28 - 10)) * 100}%, #e5e7eb 100%)`
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Los cambios se guardarán automáticamente y se aplicarán en toda la aplicación.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

