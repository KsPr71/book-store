import { supabase } from './client';

// Email del administrador
const ADMIN_EMAIL = 'jorgealejandrocasaresdelgado@gmail.com';

/**
 * Verifica si el usuario actual es administrador
 */
export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;
    
    // Verificar si el email del usuario es el del admin
    return user.email === ADMIN_EMAIL || user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Verifica si el usuario actual es admin (versión sincrónica usando el email)
 */
export function checkIsAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

