'use client';

import { useState } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, BellOff } from 'lucide-react';

export function NotificationSubscription() {
  const { permission, isSubscribed, isLoading, error, requestPermission, unsubscribe, subscribeToPush } = useNotifications();
  const [message, setMessage] = useState<string | null>(null);

  const handleToggle = async () => {
    if (isSubscribed) {
      unsubscribe();
      setMessage('Notificaciones desactivadas');
      setTimeout(() => setMessage(null), 3000);
    } else {
      const success = await requestPermission();
      if (success) {
        // Además de la suscripción en tiempo real, intentar suscribir a Push para notificaciones en background
        try {
          await subscribeToPush();
          setMessage('¡Notificaciones activadas! Suscripción Push creada.');
        } catch (e) {
          setMessage('Notificaciones activadas (realtime). Falló la suscripción Push.');
          console.error('Error subscribing to Push after granting permission', e);
        }
        setTimeout(() => setMessage(null), 5000);
      }
    }
  };

  if (permission === 'unsupported') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <BellOff className="w-5 h-5 text-neutral-500" />
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            Notificaciones no disponibles
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Tu navegador no soporta notificaciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between p-3 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
        <div className="flex items-center gap-3 flex-1">
          {isSubscribed ? (
            <Bell className="w-5 h-5 text-blue-500" />
          ) : (
            <BellOff className="w-5 h-5 text-neutral-400" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
              Notificaciones de nuevos libros
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {isSubscribed
                ? 'Recibirás notificaciones cuando se agreguen nuevos libros'
                : permission === 'denied'
                ? 'Permisos denegados. Habilítalos en la configuración de tu navegador.'
                : 'Activa para recibir notificaciones de nuevos libros'}
            </p>
          </div>
        </div>
        <button
          onClick={handleToggle}
          disabled={isLoading || permission === 'denied'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isSubscribed
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : permission === 'denied'
              ? 'bg-neutral-300 dark:bg-neutral-700 text-neutral-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            'Cargando...'
          ) : isSubscribed ? (
            'Desactivar'
          ) : (
            'Activar'
          )}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {message && (
        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-400">{message}</p>
        </div>
      )}

      {permission === 'denied' && (
        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Para habilitar las notificaciones, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
          </p>
        </div>
      )}
    </div>
  );
}

