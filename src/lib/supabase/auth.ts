import { supabase } from './client';

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignUpData extends AuthCredentials {
  firstName?: string;
  lastName?: string;
}

/**
 * Registra un nuevo usuario
 */
export async function signUp({ email, password, firstName, lastName }: SignUpData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { data: null, error: error.message || 'Error al registrar usuario' };
  }
}

/**
 * Inicia sesión con email y contraseña
 */
export async function signIn({ email, password }: AuthCredentials) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Si el error es que el email no está confirmado, intentar reenviar el email de confirmación
      if (error.message === 'Email not confirmed' || error.message?.includes('email')) {
        // Intentar reenviar email de confirmación como alternativa
        await supabase.auth.resend({
          type: 'signup',
          email,
        });
      }
      throw error;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    // Mensaje de error más amigable
    let errorMessage = 'Error al iniciar sesión';
    if (error.message === 'Email not confirmed' || error.message?.includes('email')) {
      errorMessage = 'Tu email no ha sido confirmado. Si ya configuraste Supabase para no requerir confirmación, intenta crear una nueva cuenta o contacta al administrador.';
    } else if (error.message === 'Invalid login credentials') {
      errorMessage = 'Credenciales incorrectas. Verifica tu email y contraseña.';
    } else {
      errorMessage = error.message || 'Error al iniciar sesión';
    }
    
    return { data: null, error: errorMessage };
  }
}

/**
 * Inicia sesión con proveedor OAuth (Google, GitHub, etc.)
 */
export async function signInWithProvider(provider: 'google' | 'github') {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error(`Error signing in with ${provider}:`, error);
    return { data: null, error: error.message || `Error al iniciar sesión con ${provider}` };
  }
}

/**
 * Cierra la sesión del usuario
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    return { error: error.message || 'Error al cerrar sesión' };
  }
}

/**
 * Obtiene la sesión actual del usuario
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { session, error: null };
  } catch (error: any) {
    console.error('Error getting session:', error);
    return { session: null, error: error.message };
  }
}

/**
 * Obtiene el usuario actual
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return { user, error: null };
  } catch (error: any) {
    console.error('Error getting user:', error);
    return { user: null, error: error.message };
  }
}

/**
 * Resetea la contraseña del usuario
 */
export async function resetPassword(email: string) {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return { data: null, error: error.message || 'Error al resetear contraseña' };
  }
}

