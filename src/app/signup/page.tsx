'use client';

import AuthForm from '@/components/auth-form';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black px-4 py-12">
      <div className="w-full max-w-md">
        <AuthForm mode="signup" />
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </Link>
        </div>
        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 underline"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

