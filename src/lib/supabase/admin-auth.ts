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
  } catch (error: unknown) {
    console.error('Error resending confirmation email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al reenviar email de confirmación';
    return { error: errorMessage, message: null };
  }
}

/**
 * Obtiene todos los usuarios (requiere permisos de administrador)
 * Esta función solo funciona si tienes permisos adecuados en Supabase
 * Nota: Para usar esto desde el cliente, necesitas configurar Supabase con service_role key
 * o crear un endpoint del lado del servidor con Next.js API routes
 */
export async function getAllUsers() {
  try {
    // Verificar que el cliente tenga permisos de admin
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('Error getting users:', error);
      // Si el error es por falta de permisos, retornar mensaje específico
      if (error.message?.includes('admin') || error.message?.includes('permission')) {
        return { 
          data: null, 
          error: 'No tienes permisos de administrador para ver usuarios. Esta función requiere configuración especial de Supabase.' 
        };
      }
      throw error;
    }
    
    return { data, error: null };
  } catch (error: unknown) {
    console.error('Error getting users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido al obtener usuarios';
    return { 
      data: null, 
      error: errorMessage || 'No tienes permisos para ver usuarios o falta configuración de Supabase' 
    };
  }
}

