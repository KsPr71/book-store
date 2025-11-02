/**
 * Funciones administrativas de autenticación
 * Estas funciones pueden ayudar a resolver problemas de usuarios no confirmados
 * Úsalas con cuidado, especialmente la función de actualización de usuario
 */

import { supabase } from './client';

/**
 * Reenvía el email de confirmación a un usuario
 * Útil si un usuario necesita confirmar su email
 */
export async function resendConfirmationEmail(email: string) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) throw error;

    return { error: null, message: 'Email de confirmación reenviado' };
  } catch (error: any) {
    console.error('Error resending confirmation email:', error);
    return { error: error.message || 'Error al reenviar email de confirmación', message: null };
  }
}

/**
 * Obtiene todos los usuarios (requiere permisos de administrador)
 * Esta función solo funciona si tienes permisos adecuados en Supabase
 */
export async function getAllUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    return { data, error: null };
  } catch (error: any) {
    console.error('Error getting users:', error);
    return { data: null, error: error.message || 'No tienes permisos para ver usuarios' };
  }
}

