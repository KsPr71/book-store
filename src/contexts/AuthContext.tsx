'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { signIn, signUp, signOut, signInWithProvider } from '@/lib/supabase/auth';
import { Snackbar } from '@/components/ui/snackbar';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

interface SnackbarState {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    isOpen: false,
    message: '',
    type: 'success',
  });
  const previousUserRef = React.useRef<User | null>(null);

  useEffect(() => {
    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      const initialUser = session?.user ?? null;
      setSession(session);
      setUser(initialUser);
      previousUserRef.current = initialUser;
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const newUser = session?.user ?? null;
      const prevUser = previousUserRef.current;
      
      // Mostrar snackbar de bienvenida cuando un usuario inicia sesión
      if (event === 'SIGNED_IN' && newUser && !prevUser) {
        const userName = newUser.user_metadata?.first_name 
          ? `¡Bienvenido, ${newUser.user_metadata.first_name}!`
          : '¡Bienvenido!';
        setSnackbar({
          isOpen: true,
          message: userName,
          type: 'success',
        });
      }

      // Mostrar snackbar cuando se cierra sesión
      if (event === 'SIGNED_OUT' && prevUser && !newUser) {
        setSnackbar({
          isOpen: true,
          message: 'Sesión cerrada exitosamente',
          type: 'info',
        });
      }

      setSession(session);
      setUser(newUser);
      previousUserRef.current = newUser;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async (email: string, password: string) => {
    const { error } = await signIn({ email, password });
    return { error };
  };

  const handleSignUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    const { error } = await signUp({ email, password, firstName, lastName });
    return { error };
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setSession(null);
  };

  const handleSignInWithGoogle = async () => {
    await signInWithProvider('google');
  };

  const handleSignInWithGitHub = async () => {
    await signInWithProvider('github');
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signIn: handleSignIn,
    signUp: handleSignUp,
    logout: handleLogout,
    signInWithGoogle: handleSignInWithGoogle,
    signInWithGitHub: handleSignInWithGitHub,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <Snackbar
        message={snackbar.message}
        type={snackbar.type}
        isOpen={snackbar.isOpen}
        onClose={() => setSnackbar({ ...snackbar, isOpen: false })}
        duration={4000}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

