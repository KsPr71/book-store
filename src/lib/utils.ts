import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Determina si una URL de imagen debe ser optimizada por Next.js
 * Las imágenes externas (OpenLibrary, Supabase) no deben optimizarse
 * para evitar consumir el límite de Image Transformations de Vercel
 */
export function shouldOptimizeImage(url: string | null | undefined): boolean {
  if (!url) return false;
  
  // No optimizar imágenes de Supabase Storage
  if (url.includes('supabase')) return false;
  
  // No optimizar imágenes de OpenLibrary
  if (url.includes('openlibrary.org')) return false;
  
  // Optimizar solo imágenes locales o de otros dominios confiables
  return true;
}
