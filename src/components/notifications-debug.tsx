'use client';

import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';

export default function NotificationsDebug() {
  const {
    permission,
    isSubscribed,
    isLoading,
    error,
    requestPermission,
    subscribeToPush,
    unsubscribePush,
    pushSubscription,
    showNotification,
    updateAppBadge,
    clearBadge,
  } = useNotifications();

  return (
    <div className="p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-sm border">
      <h3 className="text-lg font-semibold mb-2">Debug Notificaciones</h3>
      <div className="flex gap-2 flex-wrap mb-3">
        <button
          onClick={() => requestPermission()}
          className="px-3 py-1 rounded bg-blue-600 text-white"
        >Solicitar permisos</button>
        <button
          onClick={() => subscribeToPush()}
          className="px-3 py-1 rounded bg-green-600 text-white"
        >Suscribir Push</button>
        <button
          onClick={() => unsubscribePush()}
          className="px-3 py-1 rounded bg-yellow-600 text-white"
        >Desuscribir Push</button>
        <button
          onClick={() => updateAppBadge(1)}
          className="px-3 py-1 rounded bg-indigo-600 text-white"
        >Incrementar Badge</button>
        <button
          onClick={() => clearBadge()}
          className="px-3 py-1 rounded bg-gray-600 text-white"
        >Limpiar Badge</button>
      </div>

      <div className="text-sm">
        <p>Permission: <strong>{permission}</strong></p>
        <p>Subscribed (Notifications): <strong>{String(isSubscribed)}</strong></p>
        <p>Push subscription: <strong>{pushSubscription ? 'yes' : 'no'}</strong></p>
        <p>Loading: <strong>{String(isLoading)}</strong></p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="mt-3">
        <button
          onClick={() => showNotification?.({ book_id: 'debug-1', title: 'Libro debug', created_at: new Date().toISOString() })}
          className="px-3 py-1 rounded bg-pink-600 text-white"
        >Mostrar notificación</button>
      </div>
    </div>
  );
}
