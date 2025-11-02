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

    if (error) throw error;

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { data: null, error: error.message || 'Error al iniciar sesión' };
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

