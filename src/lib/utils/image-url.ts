/**
 * Utilidades para manejar URLs de imágenes con cache-busting
 */

/**
 * Agrega un parámetro de cache-busting a una URL de imagen
 * Esto fuerza al navegador a recargar la imagen, especialmente útil para imágenes recién subidas
 */
export function addCacheBusting(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  // Si la URL ya tiene parámetros, agregar con &
  // Si no, agregar con ?
  const separator = url.includes('?') ? '&' : '?';
  
  // Agregar timestamp para cache-busting
  // Usar un timestamp basado en la hora actual para forzar recarga
  return `${url}${separator}t=${Date.now()}`;
}

/**
 * Obtiene la URL limpia sin parámetros de cache-busting
 * Útil para guardar en la base de datos
 */
export function getCleanUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return null;
  }

  // Remover todos los parámetros de query
  return url.split('?')[0];
}

/**
 * Verifica si una URL es de Supabase Storage
 */
export function isSupabaseUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  return url.includes('supabase') || url.includes('supabase.co') || url.includes('supabase.in') || url.includes('supabase.storage');
}

