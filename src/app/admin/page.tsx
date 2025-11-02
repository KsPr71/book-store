'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { checkIsAdmin } from '@/lib/supabase/admin';
import { BookForm } from '@/components/admin/book-form';
import { BookList } from '@/components/admin/book-list';
import { AuthorForm } from '@/components/admin/author-form';
import { CategoryForm } from '@/components/admin/category-form';

type TabType = 'books' | 'list' | 'authors' | 'categories';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('books');
  
  // Calcular isAdmin directamente desde user sin estado adicional
  const isAdmin = user ? checkIsAdmin(user.email) : false;

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAdmin && user) {
      router.push('/');
    } else if (!user) {
      router.push('/login');
    }
  }, [user, authLoading, isAdmin, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">No tienes permisos de administrador</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2 ">
            Panel de Administración
          </h1>
          <p className="text-neutral-600 dark:text-neutral-400">
            Gestiona libros, autores y categorías
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-neutral-200 dark:border-neutral-700 mb-6">
          <nav className="flex space-x-8">
            {(['books', 'list', 'authors', 'categories'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-300'
                }`}
              >
                {tab === 'list' && 'Lista de Libros'}
                {tab === 'books' && 'Nuevo Libro'}
                {tab === 'authors' && 'Autores'}
                {tab === 'categories' && 'Categorías'}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenido de tabs */}
        <div>
          {activeTab === 'list' && <BookList />}
          {activeTab === 'books' && <BookForm />}
          {activeTab === 'authors' && <AuthorForm />}
          {activeTab === 'categories' && <CategoryForm />}
        </div>
      </div>
    </div>
  );
}

