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
// Cargar Workbox síncronamente al inicio (requerido por service workers)
// Esto evita el error "importScripts() of new scripts after service worker installation is not allowed"
// NOTA: Si Workbox no está disponible, el service worker seguirá funcionando para push notifications
try {
  importScripts('/workbox-e43f5367.js');
  console.log('[SW] ✅ Workbox cargado correctamente');
} catch (e) {
  console.warn('[SW] ⚠️ Workbox no disponible, continuando sin caching avanzado:', e.message);
  // El service worker continuará funcionando para push notifications
  // Solo se perderá la funcionalidad de caching de Workbox
  // Crear un objeto workbox mínimo para evitar errores en el código que lo usa
  // NO incluir NetworkFirst, NetworkOnly, etc. para que el código detecte que no está disponible
  if (typeof self.workbox === 'undefined') {
    self.workbox = {
      clientsClaim: () => {
        console.log('[SW] ⚠️ clientsClaim llamado pero Workbox no disponible');
      },
      registerRoute: () => {
        console.log('[SW] ⚠️ registerRoute llamado pero Workbox no disponible');
      },
      // NO incluir NetworkFirst, NetworkOnly, etc. para que isWorkboxAvailable detecte que no está disponible
    };
  }
}


// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    // Si es Workbox y ya está cargado, registrarlo en el registry y devolverlo
    if (uri.includes('workbox') && !registry[uri]) {
      // Workbox ya está cargado síncronamente, crear una promesa que resuelva inmediatamente
      // El objeto workbox se expone globalmente después de importScripts
      registry[uri] = Promise.resolve(self.workbox || self);
      return registry[uri];
    }
    return registry[uri] || (
      new Promise((resolve, reject) => {
        if ("document" in self) {
          const script = document.createElement("script");
          script.src = uri;
          script.onload = resolve;
          document.head.appendChild(script);
        } else {
          // En service workers, NO podemos usar importScripts() dentro de una Promise
          // Workbox ya debería estar cargado síncronamente al inicio del archivo
          if (uri.includes('workbox')) {
            // Si llegamos aquí, Workbox debería estar ya registrado arriba
            // Si no está, intentar registrarlo ahora
            if (!registry[uri]) {
              registry[uri] = Promise.resolve(self.workbox || self);
            }
            resolve();
          } else {
            reject(new Error(`Cannot load ${uri} asynchronously in service worker. importScripts() must be called synchronously during service worker installation.`));
          }
        }
      })
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn't register its module`);
        }
        return promise;
      })
    );
  };;;;;;;;;;;;;;;;

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
define(['/workbox-e43f5367'], (function (workbox) { 'use strict';

  importScripts();
  self.skipWaiting();
  
  // Verificar si Workbox está realmente disponible (tiene las clases necesarias)
  const isWorkboxAvailable = workbox && 
                              typeof workbox.clientsClaim === 'function' &&
                              typeof workbox.registerRoute === 'function' &&
                              workbox.NetworkFirst &&
                              workbox.NetworkOnly;
  
  if (isWorkboxAvailable) {
    console.log('[SW] ✅ Workbox disponible, configurando rutas de cache');
    try {
      workbox.clientsClaim();
      workbox.registerRoute("/", new workbox.NetworkFirst({
        "cacheName": "start-url",
        plugins: [{
          cacheWillUpdate: async ({
            request,
            response
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
    } catch (error) {
      console.warn('[SW] ⚠️ Error configurando Workbox routes:', error);
    }
  } else {
    console.warn('[SW] ⚠️ Workbox no está completamente disponible, saltando configuración de cache');
    console.warn('[SW] ⚠️ El service worker funcionará para push notifications pero sin caching avanzado');
  }

}));

// Push Notifications - FUERA del bloque define para que se ejecute siempre
// Esto asegura que las notificaciones funcionen incluso si Workbox falla
self.addEventListener('push', (event) => {
    console.log('[SW] 🔔 Push event received:', event);
    console.log('[SW] Event data type:', event.data ? event.data.type : 'no data');

    // Obtener URL base para iconos (necesario en móvil)
    const getBaseUrl = () => {
      try {
        // Intentar obtener desde el scope del service worker
        if (self.location && self.location.origin) {
          return self.location.origin;
        }
        // Fallback a URL de producción
        return 'https://book-store-weld-one.vercel.app';
      } catch {
        return 'https://book-store-weld-one.vercel.app';
      }
    };
    
    const baseUrl = getBaseUrl();
    
    let notificationData = {
      title: '📚 Nuevo libro disponible',
      body: 'Se ha agregado un nuevo libro al catálogo',
      icon: `${baseUrl}/icons/icon-192x192.png`, // URL absoluta para móvil
      badge: `${baseUrl}/icons/icon-192x192.png`, // URL absoluta para móvil
      tag: `notification-${Date.now()}`, // Tag único por defecto para evitar agrupación
      data: {},
    };

    if (event.data) {
      try {
        const data = event.data.json();
        console.log('[SW] ✅ Parsed push data (JSON):', data);
        // Asegurar que icon y badge sean URLs absolutas
        const iconUrl = data.icon || notificationData.icon;
        const badgeUrl = data.badge || notificationData.badge;
        
        notificationData = {
          ...notificationData,
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: iconUrl.startsWith('http') ? iconUrl : `${baseUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}`,
          badge: badgeUrl.startsWith('http') ? badgeUrl : `${baseUrl}${badgeUrl.startsWith('/') ? '' : '/'}${badgeUrl}`,
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
              // Asegurar que icon y badge sean URLs absolutas
              const iconUrl = data.icon || notificationData.icon;
              const badgeUrl = data.badge || notificationData.badge;
              
              notificationData = {
                ...notificationData,
                title: data.title || notificationData.title,
                body: data.body || notificationData.body,
                icon: iconUrl.startsWith('http') ? iconUrl : `${baseUrl}${iconUrl.startsWith('/') ? '' : '/'}${iconUrl}`,
                badge: badgeUrl.startsWith('http') ? badgeUrl : `${baseUrl}${badgeUrl.startsWith('/') ? '' : '/'}${badgeUrl}`,
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

    // Usar waitUntil para mantener el service worker activo
    // Combinar ambas operaciones en un solo waitUntil para evitar problemas
    event.waitUntil(
      (async () => {
        // PRIMERO: Mostrar la notificación (esto es lo más importante)
        try {
          // Verificar si hay clientes visibles
          const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
          const hasVisibleClient = clientList.some(client => client.visibilityState === 'visible');
          console.log('[SW] 👁️ Has visible client:', hasVisibleClient);
          console.log('[SW] 👥 Total clients:', clientList.length);
          
          // Preparar opciones de notificación
          // Simplificar para máxima compatibilidad móvil - solo incluir opciones esenciales
          const notificationOptions = {
            body: notificationData.body,
            icon: notificationData.icon,
            badge: notificationData.badge,
            tag: notificationData.tag || `notification-${Date.now()}`,
            data: notificationData.data,
            // No incluir requireInteraction, vibrate, silent ni actions por defecto
            // Estas opciones pueden causar problemas en algunos navegadores móviles
            // El navegador manejará la notificación de forma nativa
          };
          
          console.log('[SW] 📱 Opciones de notificación (simplificadas para móvil):', notificationOptions);

          console.log('[SW] 📤 Attempting to show notification with options:', notificationOptions);
          console.log('[SW] 📋 Notification title:', notificationData.title);
          console.log('[SW] 🔍 Service Worker registration:', self.registration ? 'available' : 'NOT available');
          console.log('[SW] 🔍 Notification permission check:', 'will be checked by browser');
          
          // Verificar que el registration esté disponible
          if (!self.registration) {
            throw new Error('Service Worker registration not available');
          }
          
          // Mostrar la notificación
          const notificationPromise = self.registration.showNotification(notificationData.title, notificationOptions);
          console.log('[SW] ⏳ Notification promise created, waiting...');
          
          await notificationPromise;
          console.log('[SW] ✅ Notification shown successfully');
          console.log('[SW] 📱 Notificación enviada al sistema operativo');
        } catch (error) {
          console.error('[SW] ❌ Error showing notification:', error);
          console.error('[SW] Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
          // No lanzar el error, continuar con el badge
        }

        // SEGUNDO: Manejar badge count (no crítico, puede fallar sin afectar notificaciones)
        try {
          // Guardar badge count en IndexedDB para persistencia
          const dbName = 'BookStoreDB';
          const dbVersion = 1;
          const storeName = 'badgeCount';
          
          // Abrir IndexedDB
          const db = await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, dbVersion);
            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
            request.onupgradeneeded = (event) => {
              const db = event.target.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.createObjectStore(storeName);
              }
            };
          });
          
          // Leer badge count actual
          const currentCount = await new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.get('count');
            request.onsuccess = () => resolve(request.result || 0);
            request.onerror = () => reject(request.error);
          });
          
          // Incrementar badge count
          const newCount = currentCount + 1;
          
          // Guardar nuevo count
          await new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(newCount, 'count');
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          });
          
          console.log('[SW] ✅ Badge count guardado en IndexedDB:', newCount);
          db.close();
        } catch (err) {
          console.warn('[SW] ⚠️ Error guardando badge count en IndexedDB (continuando):', err);
          // No lanzar error, solo loguear
        }
        
        // TERCERO: Enviar mensaje a los clientes para que actualicen el badge
        try {
          const clientList = await self.clients.matchAll({ includeUncontrolled: true });
          console.log('[SW] 📤 Enviando mensaje PUSH_RECEIVED a', clientList.length, 'cliente(s)');
          console.log('[SW] 📋 Datos de notificación a enviar:', notificationData);
          
          // Enviar mensaje a todos los clientes (incluso si están en segundo plano)
          clientList.forEach((client) => {
            try {
              client.postMessage({
                type: 'PUSH_RECEIVED',
                data: notificationData,
              });
              console.log('[SW] ✅ Mensaje enviado a cliente:', client.url);
            } catch (err) {
              console.error('[SW] ❌ Error enviando mensaje a cliente:', err);
            }
          });
          
          // Si no hay clientes abiertos, el badge se actualizará cuando se abra la app
          if (clientList.length === 0) {
            console.log('[SW] ⚠️ No hay clientes abiertos, el badge se actualizará cuando se abra la app desde IndexedDB');
          }
        } catch (err) {
          console.warn('[SW] ⚠️ Error enviando mensajes a clientes (continuando):', err);
          // No lanzar error, solo loguear
        }
      })()
    );
  });

  self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification clicked:', event);
    console.log('[SW] Action:', event.action);
    console.log('[SW] Notification data:', event.notification.data);
    
    event.notification.close();

    // Enviar mensaje a los clientes para que limpien el badge
    // El badge debe limpiarse desde el cliente, no desde el service worker
    event.waitUntil(
      clients.matchAll({ includeUncontrolled: true }).then((clientList) => {
        console.log('[SW] 📤 Enviando mensaje NOTIFICATION_CLICKED a', clientList.length, 'cliente(s)');
        clientList.forEach((client) => {
          try {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data,
            });
            console.log('[SW] ✅ Mensaje NOTIFICATION_CLICKED enviado a cliente:', client.url);
          } catch (err) {
            console.error('[SW] ❌ Error enviando mensaje a cliente:', err);
          }
        });
      })
    );

    // Manejar acciones del botón
    if (event.action === 'close') {
      return;
    }

    // Abrir la URL del libro o la página principal
    // La URL puede ser absoluta (https://...) o relativa (/book/...)
    let urlToOpen = event.notification.data?.url || '/';
    
    // URL de producción (siempre usar esta en lugar de preview)
    const PRODUCTION_URL = 'https://book-store-weld-one.vercel.app';
    
    event.waitUntil(
      (async () => {
        // Si la URL es absoluta y contiene una URL de preview de Vercel, reemplazarla por producción
        if (urlToOpen.startsWith('http')) {
          // Reemplazar cualquier URL de preview de Vercel por la URL de producción
          urlToOpen = urlToOpen.replace(/https:\/\/book-store-[^/]+\.vercel\.app/, PRODUCTION_URL);
        } else if (urlToOpen.startsWith('/')) {
          // Si la URL es relativa, construir la URL absoluta usando la URL de producción
          urlToOpen = PRODUCTION_URL + urlToOpen;
        }
        
        console.log('[SW] Opening URL:', urlToOpen);
        
        const clientList = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        
        // Si hay una ventana abierta con la misma URL, enfocarla
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          try {
            const clientUrl = new URL(client.url);
            const targetUrl = new URL(urlToOpen);
            
            // Comparar pathname para evitar problemas con query params
            if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
              return client.focus();
            }
          } catch (e) {
            // Si hay error al comparar URLs, continuar
            console.log('[SW] Error comparing URLs:', e);
          }
        }
        
        // Si no hay ventana abierta, abrir una nueva con la URL absoluta
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })()
    );
  });
