"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {Devider} from "./Devider";
type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function AboutModal({ isOpen, onClose }: Props) {
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
            className="relative z-10 mx-4 max-w-2xl rounded-lg bg-white dark:bg-gray-900 p-6 shadow-lg border-2 border-blue-400 dark:border-gray-800"
          >
                       
            <div className="flex items-start justify-between flex-wrap gap-4 justify-center">
               

                
                <div className="text-gray-900 dark:text-white">
                    <Image
                        alt="logo"
                        src={'/logo2.svg'}
                        width={200}
                        height={200}
                        className="dark:invert"
                    />
                </div>
                

              <div>
                <Devider title= ''/>
                
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                  Click & Read es una Biblioteca Digital al alcance de tu mano. Todos los libros y recursos que necesitas, accesibles desde cualquier dispositivo, en cualquier momento.
                </p>
              </div>

         
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
              <p>
               Esta biblioteca ha sido creada con NextJS, React, 
                  TailwindCSS, Typescript con base de datos PosgreSQL alojada en Supabase 
                  y sitio desplegado en Vercel.
              </p>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
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
