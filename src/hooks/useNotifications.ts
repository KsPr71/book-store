'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

type NotificationPermissionState = NotificationPermission | 'unsupported';

interface NewBook {
  book_id: string;
  title: string;
  cover_image_url?: string | null;
  created_at: string;
}

interface WindowWithChannels extends Window {
  __supabaseChannel?: RealtimeChannel;
  __bookCheckInterval?: NodeJS.Timeout;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showNotificationRef = useRef<(book: NewBook) => void | undefined>(undefined);

  // Badge API - COMPLETAMENTE DESHABILITADO para evitar interferir con instalación de PWA
  // Se puede habilitar después de que la app esté instalada
  const updateAppBadge = useCallback(async () => {
    // No hacer nada - completamente deshabilitado
    return;
  }, []);

  const clearBadge = useCallback(async () => {
    // No hacer nada - completamente deshabilitado
    return;
  }, []);

  // Mostrar notificación
  const showNotification = useCallback((book: NewBook) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    const notification = new Notification('📚 Nuevo libro disponible', {
      body: `${book.title} ha sido agregado al catálogo`,
      icon: book.cover_image_url || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `book-${book.book_id}`,
      requireInteraction: false,
      data: {
        url: `/book/${book.book_id}`,
        bookId: book.book_id,
      },
    });

    notification.onclick = () => {
      window.focus();
      window.location.href = `/book/${book.book_id}`;
      notification.close();
    };

    // Badge completamente deshabilitado para evitar interferir con instalación de PWA

    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, []);

  // Guardar referencia para usar en otros callbacks
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Verificar permisos y estado de suscripción al cargar
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    const currentPermission = Notification.permission;
    setPermission(currentPermission);

    // Verificar si hay una suscripción guardada
    const subscription = localStorage.getItem('bookNotificationsEnabled');
    setIsSubscribed(subscription === 'true' && currentPermission === 'granted');
  }, []);

  // Suscribirse a nuevos libros usando Supabase Realtime
  const subscribeToNewBooks = useCallback(async () => {
    try {
      // Obtener la fecha del último libro visto
      const lastCheckDate = localStorage.getItem('lastBookCheckDate');
      const lastCheck = lastCheckDate ? new Date(lastCheckDate) : new Date(Date.now() - 24 * 60 * 60 * 1000); // Últimas 24 horas por defecto

      // Suscribirse a cambios en la tabla books
      const channel = supabase
        .channel('new-books-notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'books',
            filter: `status=eq.available`,
          },
          (payload) => {
            const newBook = payload.new as NewBook;
            const bookCreatedAt = new Date(newBook.created_at);

            // Solo notificar si el libro es más reciente que la última verificación
            if (bookCreatedAt > lastCheck && showNotificationRef.current) {
              showNotificationRef.current(newBook);
              // Actualizar la fecha de última verificación
              localStorage.setItem('lastBookCheckDate', new Date().toISOString());
              // El badge se actualiza automáticamente en showNotification
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✅ Suscrito a notificaciones de nuevos libros');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Error en la suscripción a notificaciones');
            setError('Error al conectar con el servidor de notificaciones');
          }
        });

      // Guardar el canal para poder cancelarlo después
      (window as WindowWithChannels).__supabaseChannel = channel;

      // También verificar periódicamente nuevos libros (cada 5 minutos) como respaldo
      const checkInterval = setInterval(async () => {
        try {
          const lastCheck = localStorage.getItem('lastBookCheckDate');
          const response = await fetch(
            `/api/notifications/check-new-books?lastCheckDate=${lastCheck || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
          );
          
          if (response.ok) {
            const data = await response.json() as { newBooks: NewBook[]; lastCheck: string };
            if (data.newBooks && data.newBooks.length > 0 && showNotificationRef.current) {
              // Mostrar notificación para cada nuevo libro
              data.newBooks.forEach((book) => {
                showNotificationRef.current?.(book);
              });
              localStorage.setItem('lastBookCheckDate', data.lastCheck);
              // El badge se actualiza automáticamente en showNotification para cada libro
            }
          }
        } catch (err) {
          console.error('Error al verificar nuevos libros:', err);
        }
      }, 5 * 60 * 1000); // Cada 5 minutos

      // Guardar el intervalo para poder cancelarlo después
      (window as WindowWithChannels).__bookCheckInterval = checkInterval;

      return channel;
    } catch (err) {
      console.error('Error al suscribirse a nuevos libros:', err);
      setError('Error al configurar las notificaciones');
    }
  }, []);

  // Solicitar permisos de notificación
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setError('Tu navegador no soporta notificaciones');
      return false;
    }

    if (Notification.permission === 'granted') {
      setIsSubscribed(true);
      localStorage.setItem('bookNotificationsEnabled', 'true');
      await subscribeToNewBooks();
      return true;
    }

    if (Notification.permission === 'denied') {
      setError('Los permisos de notificación fueron denegados. Por favor, habilítalos en la configuración de tu navegador.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        setIsSubscribed(true);
        localStorage.setItem('bookNotificationsEnabled', 'true');
        
        // Iniciar la suscripción a cambios en tiempo real
        await subscribeToNewBooks();
        
        return true;
      } else {
        setError('Permisos de notificación denegados');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al solicitar permisos';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [subscribeToNewBooks]);

  // Desactivar notificaciones
  const unsubscribe = useCallback(() => {
    localStorage.removeItem('bookNotificationsEnabled');
    setIsSubscribed(false);
    
    // Cancelar suscripción a Supabase Realtime
    const channel = (window as WindowWithChannels).__supabaseChannel;
    if (channel) {
      supabase.removeChannel(channel);
      delete (window as WindowWithChannels).__supabaseChannel;
    }

    // Cancelar intervalo de verificación periódica
    const interval = (window as WindowWithChannels).__bookCheckInterval;
    if (interval) {
      clearInterval(interval);
      delete (window as WindowWithChannels).__bookCheckInterval;
    }
  }, []);

  // Inicializar suscripción si está habilitada
  useEffect(() => {
    if (isSubscribed && permission !== 'unsupported' && permission === 'granted') {
      subscribeToNewBooks();
    }

    // Limpiar suscripción al desmontar
    return () => {
      const channel = (window as WindowWithChannels).__supabaseChannel;
      if (channel) {
        supabase.removeChannel(channel);
        delete (window as WindowWithChannels).__supabaseChannel;
      }

      const interval = (window as WindowWithChannels).__bookCheckInterval;
      if (interval) {
        clearInterval(interval);
        delete (window as WindowWithChannels).__bookCheckInterval;
      }
    };
  }, [isSubscribed, permission, subscribeToNewBooks]);

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    unsubscribe,
    showNotification,
    clearBadge,
    updateAppBadge,
  };
}
