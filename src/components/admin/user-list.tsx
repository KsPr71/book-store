'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Search, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface UserData {
  id: string;
  email: string;
  createdAt: string;
  emailConfirmed: boolean;
  lastSignIn?: string;
}

export function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener la sesión actual para el token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setError('No autenticado. Por favor, inicia sesión.');
        setUsers([]);
        setLoading(false);
        return;
      }

      // Llamar a la API route con el token de autenticación
      const response = await fetch('/api/admin/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al cargar usuarios');
        setUsers([]);
      } else if (data.users) {
        setUsers(data.users);
      } else {
        setError('No se recibieron datos de usuarios');
        setUsers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar usuarios basado en el término de búsqueda
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }

    const term = searchTerm.toLowerCase().trim();
    
    return users.filter((user) => {
      // Buscar en email
      const emailMatch = user.email.toLowerCase().includes(term);
      
      // Buscar en fecha de creación (formato de fecha)
      const dateMatch = new Date(user.createdAt).toLocaleDateString('es-ES').includes(term);
      
      return emailMatch || dateMatch;
    });
  }, [users, searchTerm]);

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
          Lista de Usuarios ({filteredUsers.length} de {users.length})
        </h3>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <Input
            type="text"
            placeholder="Buscar por email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Fecha de Registro
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Último Acceso
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                    {searchTerm ? `No se encontraron usuarios que coincidan con "${searchTerm}"` : 'No hay usuarios registrados'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm font-medium text-neutral-900 dark:text-white">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {user.emailConfirmed ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">Confirmado</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-yellow-600 dark:text-yellow-400">Pendiente</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-neutral-400" />
                        <span className="text-sm text-neutral-600 dark:text-neutral-400">
                          {formatDate(user.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {user.lastSignIn ? formatDate(user.lastSignIn) : 'Nunca'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

