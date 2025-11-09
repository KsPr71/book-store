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
  // Badge API - Intentaremos actualizar el badge usando la API de Badging si está disponible.
  // Guardamos un contador en localStorage para persistir el número de notificaciones no leídas.
  const BADGE_STORAGE_KEY = 'book_unread_count';

  type BadgingNavigator = Navigator & {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };

  const setBadgeCount = useCallback(async (count: number) => {
    try {
      const nav = navigator as BadgingNavigator;
      if (typeof nav.setAppBadge === 'function') {
        await nav.setAppBadge(count);
      }
      localStorage.setItem(BADGE_STORAGE_KEY, String(count));
    } catch (err) {
      // Falla silenciosa - API no soportada o error
      console.debug('Badge API set failed', err);
    }
  }, []);

  const clearBadge = useCallback(async () => {
    try {
      const nav = navigator as BadgingNavigator;
      if (typeof nav.clearAppBadge === 'function') {
        await nav.clearAppBadge();
      }
      localStorage.removeItem(BADGE_STORAGE_KEY);
    } catch (err) {
      console.debug('Badge API clear failed', err);
    }
  }, []);

  const updateAppBadge = useCallback(async (increment = 1) => {
    try {
      const current = parseInt(localStorage.getItem(BADGE_STORAGE_KEY) || '0', 10) || 0;
      const next = current + increment;
      await setBadgeCount(next);
    } catch (err) {
      console.debug('Error updating badge count', err);
    }
  }, [setBadgeCount]);

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
    // Incrementar badge cuando se muestra notificación
    updateAppBadge(1);
  }, [updateAppBadge]);

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
    // Implementación con reintentos si el canal devuelve CHANNEL_ERROR
    const maxRetries = 3;
    let attempt = 0;
    const lastCheckDate = localStorage.getItem('lastBookCheckDate');
    const lastCheck = lastCheckDate ? new Date(lastCheckDate) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const createChannel = () => {
      return supabase
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
            try {
              const newBook = payload.new as NewBook;
              const bookCreatedAt = new Date(newBook.created_at);
              if (bookCreatedAt > lastCheck && showNotificationRef.current) {
                showNotificationRef.current(newBook);
                localStorage.setItem('lastBookCheckDate', new Date().toISOString());
              }
            } catch (e) {
              console.error('Error handling realtime payload', e);
            }
          }
        );
    };

  const subscribeWithRetry = async (): Promise<RealtimeChannel | void> => {
      while (attempt < maxRetries) {
        attempt += 1;
        const channel = createChannel();
        try {
          const sub = await channel.subscribe();
          // supabase channel.subscribe may return an object or set status via callback; check returned status
          // Listen for status updates via the object's state if available
          if (sub && (sub as unknown as { status?: string }).status === 'SUBSCRIBED') {
            console.log('✅ Suscrito a notificaciones de nuevos libros (attempt', attempt, ')');
            (window as WindowWithChannels).__supabaseChannel = channel;
            break;
          }

          // If subscribe didn't throw but we don't have SUBSCRIBED, attach a small listener for channel status
          channel.subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              console.log('✅ Suscrito a notificaciones de nuevos libros');
              (window as WindowWithChannels).__supabaseChannel = channel;
            } else if (status === 'CHANNEL_ERROR') {
              console.error('❌ Error en la suscripción a notificaciones (status CHANNEL_ERROR)');
              setError('Error al conectar con el servidor de notificaciones');
            }
          });

          // If we reached here assume subscription object is acceptable
          (window as WindowWithChannels).__supabaseChannel = channel;
          break;
        } catch (err) {
          console.error('Suscripción intento', attempt, 'falló:', err);
          setError('Error al conectar con el servidor de notificaciones — reintentando');
          // Exponential backoff
          const wait = Math.min(500 * Math.pow(2, attempt - 1), 5000);
          await new Promise((r) => setTimeout(r, wait));
          if (attempt >= maxRetries) {
            console.error('Máximo de reintentos alcanzado para suscripción realtime');
            setError('No se pudo conectar al servidor de notificaciones');
            break;
          }
        }
      }
    };

    // Start periodic polling backup (every 5 minutes) even if realtime hasn't connected yet
    const checkInterval = setInterval(async () => {
      try {
        const last = localStorage.getItem('lastBookCheckDate');
        const response = await fetch(
          `/api/notifications/check-new-books?lastCheckDate=${last || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`
        );

        if (response.ok) {
          const data = await response.json() as { newBooks: NewBook[]; lastCheck: string };
          if (data.newBooks && data.newBooks.length > 0 && showNotificationRef.current) {
            data.newBooks.forEach((book) => {
              showNotificationRef.current?.(book);
            });
            localStorage.setItem('lastBookCheckDate', data.lastCheck);
          }
        }
      } catch (err) {
        console.error('Error al verificar nuevos libros (polling):', err);
      }
    }, 5 * 60 * 1000);

    (window as WindowWithChannels).__bookCheckInterval = checkInterval;

    // Kick off the subscribe attempts
    await subscribeWithRetry();
    return (window as WindowWithChannels).__supabaseChannel;
  }, []);

  // --- PUSH API helpers ---
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);

  const ensureServiceWorkerRegistered = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
    try {
      // Intentar registrar sw.js si no está registrado
      // Si ya está, navigator.serviceWorker.ready devolverá el registration
      const registration = await navigator.serviceWorker.ready;
      return registration;
    } catch (err) {
      // navigator.serviceWorker.ready puede fallar si no hay SW
      console.debug('navigator.serviceWorker.ready failed', err);
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
        return reg;
      } catch (e) {
        console.debug('SW register failed', e);
        return null;
      }
    }
  }, []);

  const getVapidKey = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch('/api/notifications/vapid');
      if (!res.ok) return null;
      const json = await res.json();
      return json.publicKey as string | null;
    } catch (err) {
      console.error('Error fetching VAPID key', err);
      return null;
    }
  }, []);

  const subscribeToPush = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setError('Push no soportado en este navegador');
      return false;
    }

    const registration = await ensureServiceWorkerRegistered();
    if (!registration) {
      setError('No hay Service Worker disponible para Push');
      return false;
    }

    const publicKey = await getVapidKey();
    if (!publicKey) {
      setError('No se pudo obtener la clave VAPID');
      return false;
    }

    try {
      // Convertir clave VAPID (base64url) a Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      setPushSubscription(sub);

      // Enviar subscription serializada al backend para guardar
  type PushSubLike = PushSubscription & { toJSON?: () => Record<string, unknown> };
  const subLike = sub as PushSubLike;
  const subPayload = subLike.toJSON ? subLike.toJSON() : (sub as unknown as Record<string, unknown>);
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subPayload }),
      });

      return true;
    } catch (err) {
      console.error('Error subscribing to push', err);
      const message = err instanceof Error ? err.message : 'Error al suscribirse a Push';
      setError(message);
      return false;
    }
  }, [ensureServiceWorkerRegistered, getVapidKey]);

  const unsubscribePush = useCallback(async (): Promise<boolean> => {
    try {
      const registration = await ensureServiceWorkerRegistered();
      if (!registration) return false;
      const sub = await registration.pushManager.getSubscription();
      if (!sub) return true;
      await sub.unsubscribe();
      setPushSubscription(null);
      // Informar al backend
      await fetch('/api/notifications/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) });
      return true;
    } catch (err) {
      console.error('Error unsubscribing', err);
      return false;
    }
  }, [ensureServiceWorkerRegistered]);

  // Inicializar estado de Push subscription
  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          const sub = await registration.pushManager.getSubscription();
          if (sub) setPushSubscription(sub);
        }
      } catch (err) {
        console.debug('Error checking existing push subscription', err);
      }
    })();
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
    // Push helpers
    subscribeToPush,
    unsubscribePush,
    pushSubscription,
  };
}
