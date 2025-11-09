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

interface NavigatorBadge {
  setAppBadge?(count: number): Promise<void>;
  clearAppBadge?(): Promise<void>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  const showNotificationRef = useRef<(book: NewBook) => void | undefined>(undefined);
  const badgeCountRef = useRef<number>(0);

  // Badge API - Habilitado para mostrar número de notificaciones
  const updateAppBadge = useCallback(async (count?: number) => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Obtener el contador actual si no se proporciona
    const badgeCount = count !== undefined ? count : badgeCountRef.current;

    // Verificar si el Badge API está disponible
    const navigatorBadge = navigator as Navigator & NavigatorBadge;
    
    if (navigatorBadge.setAppBadge) {
      try {
        if (badgeCount > 0) {
          await navigatorBadge.setAppBadge(badgeCount);
          console.log(`✅ Badge actualizado: ${badgeCount}`);
        } else {
          await navigatorBadge.clearAppBadge?.();
          console.log('✅ Badge limpiado');
        }
      } catch (err) {
        console.error('Error actualizando badge:', err);
      }
    } else {
      console.log('Badge API no disponible en este navegador');
    }
  }, []);

  const incrementBadge = useCallback(async () => {
    badgeCountRef.current += 1;
    // Guardar en localStorage para persistencia
    localStorage.setItem('badgeCount', badgeCountRef.current.toString());
    await updateAppBadge(badgeCountRef.current);
  }, [updateAppBadge]);

  const clearBadge = useCallback(async () => {
    badgeCountRef.current = 0;
    localStorage.removeItem('badgeCount');
    await updateAppBadge(0);
  }, [updateAppBadge]);

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
      // Limpiar badge cuando el usuario hace clic en la notificación
      clearBadge();
    };

    // Incrementar badge cuando se muestra una notificación
    incrementBadge();

    // Cerrar automáticamente después de 5 segundos
    setTimeout(() => {
      notification.close();
    }, 5000);
  }, [incrementBadge, clearBadge]);

  // Guardar referencia para usar en otros callbacks
  useEffect(() => {
    showNotificationRef.current = showNotification;
  }, [showNotification]);

  // Escuchar mensajes del service worker
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'NOTIFICATION_CLICKED') {
        // Limpiar badge cuando se hace clic en una notificación desde el SW
        clearBadge();
      } else if (event.data && event.data.type === 'PUSH_RECEIVED') {
        // Incrementar badge cuando se recibe un push (si la app está abierta)
        incrementBadge();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, [clearBadge, incrementBadge]);

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

    // Cargar push subscription guardada
    const savedPushSub = localStorage.getItem('pushSubscription');
    if (savedPushSub) {
      try {
        setPushSubscription(JSON.parse(savedPushSub));
      } catch (e) {
        console.error('Error parsing saved push subscription:', e);
      }
    }

    // Restaurar badge count desde localStorage
    const savedBadgeCount = localStorage.getItem('badgeCount');
    if (savedBadgeCount) {
      const count = parseInt(savedBadgeCount, 10);
      if (!isNaN(count) && count > 0) {
        badgeCountRef.current = count;
        // Actualizar badge solo si la app está instalada (PWA)
        // Verificar si está en modo standalone
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (isStandalone) {
          updateAppBadge(count);
        }
      }
    }
  }, [updateAppBadge]);

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

  // Suscribirse a Push Notifications
  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications no están disponibles en este navegador');
      return false;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Permisos de notificación no concedidos');
      return false;
    }

    try {
      // Obtener el service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Obtener la clave pública VAPID
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID_PUBLIC_KEY no está configurada');
        return false;
      }

      // Convertir la clave VAPID a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);

      // Suscribirse a push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Convertir la suscripción a un formato serializable
      const subscriptionData: PushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      // Guardar localmente
      setPushSubscription(subscriptionData);
      localStorage.setItem('pushSubscription', JSON.stringify(subscriptionData));

      // Enviar al servidor
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscriptionData }),
      });

      if (!response.ok) {
        throw new Error('Error al registrar la suscripción en el servidor');
      }

      console.log('✅ Suscrito a push notifications');
      return true;
    } catch (err) {
      console.error('Error al suscribirse a push notifications:', err);
      setError('Error al configurar las notificaciones push');
      return false;
    }
  }, []);

  // Desuscribirse de Push Notifications
  const unsubscribePush = useCallback(async (): Promise<void> => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Desuscrito de push notifications');
      }

      // Limpiar del servidor
      if (pushSubscription) {
        await fetch('/api/notifications/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: pushSubscription.endpoint }),
        });
      }

      setPushSubscription(null);
      localStorage.removeItem('pushSubscription');
    } catch (err) {
      console.error('Error al desuscribirse de push notifications:', err);
    }
  }, [pushSubscription]);

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

    // Desuscribirse de push notifications
    unsubscribePush();
  }, [unsubscribePush]);

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
    subscribeToPush,
    unsubscribePush,
    pushSubscription,
  };
}

// Funciones auxiliares para convertir claves VAPID
function urlBase64ToUint8Array(base64String: string): BufferSource {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
