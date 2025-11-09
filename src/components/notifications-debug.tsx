'use client';

import React, { useEffect, useState } from 'react';
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

  const [lastServerResponse, setLastServerResponse] = useState<string | null>(null);
  const [lastPushMessage, setLastPushMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      try {
        const data = event.data;
        if (data && data.type === 'PUSH_RECEIVED') {
          setLastPushMessage(JSON.stringify(data.data));
          console.log('Client received SW message PUSH_RECEIVED', data.data);
        }
      } catch (e) {
        console.error('Error handling SW message', e);
      }
    };

    if (navigator?.serviceWorker) {
      navigator.serviceWorker.addEventListener('message', handler);
    }

    return () => {
      if (navigator?.serviceWorker) {
        navigator.serviceWorker.removeEventListener('message', handler);
      }
    };
  }, []);

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
        <button
          onClick={async () => {
            if (!pushSubscription) {
              setLastServerResponse('No hay push subscription registrada. Suscríbete primero.');
              return;
            }
            try {
              const res = await fetch('/api/notifications/send-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscription: pushSubscription, payload: { title: 'Push desde server', body: 'Mensaje enviado desde el backend de prueba' } })
              });
              const json = await res.json();
              setLastServerResponse(JSON.stringify(json));
            } catch (err) {
              setLastServerResponse('Error conectando con el endpoint de prueba: ' + String(err));
            }
          }}
          className="px-3 py-1 rounded bg-emerald-600 text-white"
        >Enviar push de prueba (server)</button>
      </div>

      <div className="text-sm">
        <p>Permission: <strong>{permission}</strong></p>
        <p>Subscribed (Notifications): <strong>{String(isSubscribed)}</strong></p>
        <p>Push subscription: <strong>{pushSubscription ? 'yes' : 'no'}</strong></p>
        <p>Loading: <strong>{String(isLoading)}</strong></p>
        {error && <p className="text-red-500">Error: {error}</p>}
      </div>

      <div className="mt-3 text-sm">
        <p>Última respuesta del servidor: <strong className="break-words">{lastServerResponse || '—'}</strong></p>
        <p>Último mensaje recibido por SW: <strong className="break-words">{lastPushMessage || '—'}</strong></p>
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
