/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-e43f5367'], (function (workbox) { 'use strict';

  importScripts();
  self.skipWaiting();
  workbox.clientsClaim();
  workbox.registerRoute("/", new workbox.NetworkFirst({
    "cacheName": "start-url",
    plugins: [{
      cacheWillUpdate: async ({
        request,
        response,
        event,
        state
      }) => {
        if (response && response.type === 'opaqueredirect') {
          return new Response(response.body, {
            status: 200,
            statusText: 'OK',
            headers: response.headers
          });
        }
        return response;
      }
    }]
  }), 'GET');
  workbox.registerRoute(/.*/i, new workbox.NetworkOnly({
    "cacheName": "dev",
    plugins: []
  }), 'GET');

  // Push Notifications
  self.addEventListener('push', (event) => {
    console.log('[SW] 🔔 Push event received:', event);
    console.log('[SW] Event data type:', event.data ? event.data.type : 'no data');

    let notificationData = {
      title: '📚 Nuevo libro disponible',
      body: 'Se ha agregado un nuevo libro al catálogo',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: `notification-${Date.now()}`, // Tag único por defecto para evitar agrupación
      requireInteraction: false,
      data: {},
    };

    if (event.data) {
      try {
        const data = event.data.json();
        console.log('[SW] ✅ Parsed push data (JSON):', data);
        notificationData = {
          ...notificationData,
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: data.icon || notificationData.icon,
          badge: data.badge || notificationData.badge,
          tag: data.tag || notificationData.tag,
          data: data.data || {},
        };
      } catch (e) {
        console.log('[SW] ⚠️ Error parsing JSON, trying text:', e);
        try {
          const text = event.data.text();
          if (text) {
            try {
              const data = JSON.parse(text);
              console.log('[SW] ✅ Parsed push data (text->JSON):', data);
              notificationData = {
                ...notificationData,
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: data.icon || notificationData.icon,
                badge: data.badge || notificationData.badge,
                tag: data.tag || notificationData.tag,
                data: data.data || {},
              };
            } catch (e2) {
              console.log('[SW] ⚠️ Using text as body:', text);
              notificationData.body = text;
            }
          }
        } catch (e3) {
          console.error('[SW] ❌ Error reading event data:', e3);
        }
      }
    } else {
      console.log('[SW] ⚠️ No data in push event, using defaults');
    }

    console.log('[SW] 📋 Final notification data:', notificationData);

    // SIEMPRE mostrar la notificación, independientemente del estado de los clientes
    const showNotificationPromise = (async () => {
      try {
        // Verificar si hay clientes visibles
        const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        const hasVisibleClient = clientList.some(client => client.visibilityState === 'visible');
        console.log('[SW] 👁️ Has visible client:', hasVisibleClient);
        console.log('[SW] 👥 Total clients:', clientList.length);
        
        // Preparar opciones de notificación
        const notificationOptions = {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag || `notification-${Date.now()}`, // Tag único si no se proporciona
          requireInteraction: false, // Cambiar a false para que se muestre incluso en segundo plano
          data: notificationData.data,
          vibrate: [200, 100, 200],
          silent: false,
          actions: [
            {
              action: 'open',
              title: 'Ver libro',
            },
            {
              action: 'close',
              title: 'Cerrar',
            },
          ],
        };

        console.log('[SW] 📤 Attempting to show notification with options:', notificationOptions);
        console.log('[SW] 📋 Notification title:', notificationData.title);
        
        // Mostrar la notificación - esto debería funcionar siempre que el service worker esté activo
        // y los permisos estén concedidos
        await self.registration.showNotification(notificationData.title, notificationOptions);
        console.log('[SW] ✅ Notification shown successfully');
        
        return true;
      } catch (error) {
        console.error('[SW] ❌ Error showing notification:', error);
        console.error('[SW] Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        // No lanzar el error para que el badge se actualice de todas formas
        return false;
      }
    })();

    // Usar waitUntil para mantener el service worker activo
    event.waitUntil(showNotificationPromise);

    event.waitUntil(
      self.clients.matchAll().then((clientList) => {
        console.log('[SW] Sending message to', clientList.length, 'client(s)');
        clientList.forEach((client) => {
          client.postMessage({
            type: 'PUSH_RECEIVED',
            data: notificationData,
          });
        });
        
        // Incrementar badge en el service worker también
        // Esto funciona incluso cuando la app está cerrada
        if (self.registration && self.registration.setAppBadge) {
          // Obtener el contador actual del badge o usar 1
          self.registration.getAppBadge()
            .then((currentCount) => {
              const newCount = (currentCount || 0) + 1;
              return self.registration.setAppBadge(newCount);
            })
            .then(() => {
              console.log('[SW] ✅ Badge incrementado desde service worker');
            })
            .catch((err) => {
              console.log('[SW] Error setting badge:', err);
              // Si getAppBadge no está disponible, intentar solo setAppBadge
              self.registration.setAppBadge(1).catch(() => {
                console.log('[SW] Badge API no disponible');
              });
            });
        }
      })
    );
  });

  self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    console.log('[SW] Action:', event.action);
    console.log('[SW] Notification data:', event.notification.data);
    
    event.notification.close();

    // Limpiar badge cuando se hace clic en la notificación
    if (self.registration && self.registration.clearAppBadge) {
      self.registration.clearAppBadge().catch((err) => {
        console.log('[SW] Error clearing badge:', err);
      });
    }

    // Enviar mensaje a los clientes para que también limpien el badge
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data,
          });
        });
      })
    );

    // Manejar acciones del botón
    if (event.action === 'close') {
      return;
    }

    // Abrir la URL del libro o la página principal
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        // Si hay una ventana abierta, enfocarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  });

}));
