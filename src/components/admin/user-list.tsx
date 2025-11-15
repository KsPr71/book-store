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
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
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

  // Función para abrir WhatsApp con el usuario
  const openWhatsApp = (user: UserData) => {
    if (!user.phoneNumber) {
      alert('Este usuario no tiene número de teléfono registrado.');
      return;
    }

    // Extraer solo los dígitos del número de teléfono (eliminar +, espacios, etc.)
    const phoneDigits = user.phoneNumber.replace(/\D/g, '');
    
    // Crear mensaje personalizado
    const userName = user.firstName || user.lastName 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
      : user.email.split('@')[0];
    
    const message = `Hola ${userName}, te contactamos desde Click & Read.`;
    const encodedMessage = encodeURIComponent(message);
    
    // Crear URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneDigits}?text=${encodedMessage}`;
    
    // Abrir WhatsApp en una nueva ventana
    window.open(whatsappUrl, '_blank');
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
                <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-900 divide-y divide-neutral-200 dark:divide-neutral-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
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
                    <td className="px-4 py-4 whitespace-nowrap">
                      {user.phoneNumber ? (
                        <button
                          onClick={() => openWhatsApp(user)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#25D366] hover:bg-[#20BA5A] text-white font-medium transition-colors duration-200 text-sm"
                          title="Enviar mensaje por WhatsApp"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            className="w-4 h-4"
                          >
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                          </svg>
                          WhatsApp
                        </button>
                      ) : (
                        <span className="text-sm text-neutral-400 dark:text-neutral-500 italic">
                          Sin teléfono
                        </span>
                      )}
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

