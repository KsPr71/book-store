/**
 * Script para inyectar código de push notifications en el service worker generado por next-pwa
 * Se ejecuta después del build para asegurar que el código de push notifications esté presente
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

// Código de push notifications a inyectar
const PUSH_NOTIFICATIONS_CODE = `
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
      icon: baseUrl + '/icons/icon-192x192.png', // URL absoluta para móvil
      badge: baseUrl + '/icons/icon-192x192.png', // URL absoluta para móvil
      tag: 'notification-' + Date.now(),
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
          icon: iconUrl.startsWith('http') ? iconUrl : baseUrl + (iconUrl.startsWith('/') ? '' : '/') + iconUrl,
          badge: badgeUrl.startsWith('http') ? badgeUrl : baseUrl + (badgeUrl.startsWith('/') ? '' : '/') + badgeUrl,
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
                icon: iconUrl.startsWith('http') ? iconUrl : baseUrl + (iconUrl.startsWith('/') ? '' : '/') + iconUrl,
                badge: badgeUrl.startsWith('http') ? badgeUrl : baseUrl + (badgeUrl.startsWith('/') ? '' : '/') + badgeUrl,
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
            tag: notificationData.tag || 'notification-' + Date.now(),
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
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })()
    );
  });
`;

function injectPushNotifications() {
  try {
    // Verificar si el archivo existe
    if (!fs.existsSync(SW_PATH)) {
      console.warn('⚠️  sw.js no encontrado. Ejecuta "npm run build" primero.');
      return;
    }

    // Leer el contenido actual
    let swContent = fs.readFileSync(SW_PATH, 'utf8');

    // Corregir la ruta del workbox a una ruta absoluta para evitar errores 404 en producción
    // Buscar patrones como './workbox-*.js' y reemplazarlos con rutas absolutas
    const workboxPattern = /define\(\[['"]\.\/(workbox-[^'"]+)['"]/g;
    
    if (workboxPattern.test(swContent)) {
      // Reemplazar todas las ocurrencias de './workbox-*.js' con '/workbox-*.js'
      swContent = swContent.replace(
        /define\(\[['"]\.\/(workbox-[^'"]+)['"]/g,
        (match, workboxFile) => {
          console.log(`✅ Ruta de workbox corregida: ./${workboxFile} -> /${workboxFile}`);
          return `define(['"/${workboxFile}"']`;
        }
      );
    }

    // CORREGIR: Cargar Workbox de forma síncrona al inicio para evitar el error de importScripts
    // El problema es que el código actual intenta cargar Workbox de forma asíncrona dentro de una Promise
    // Esto no está permitido en service workers. Necesitamos cargar Workbox síncronamente al inicio.
    const workboxFileMatch = swContent.match(/define\(\[['"]\/(workbox-[^'"]+)['"]/);
    if (workboxFileMatch) {
      const workboxFile = workboxFileMatch[1];
      console.log(`🔧 Corrigiendo carga asíncrona de Workbox: ${workboxFile}`);
      
      // Verificar si Workbox ya se carga síncronamente al inicio
      // También verificar si necesita actualizarse con manejo de errores
      const hasWorkboxLoad = swContent.includes('// Cargar Workbox síncronamente');
      const hasErrorHandling = swContent.includes('Workbox no disponible');
      
      // Preparar el código de carga con manejo de errores
      const workboxUrl = `/${workboxFile}.js`;
      const syncLoadCode = `\n// Cargar Workbox síncronamente al inicio (requerido por service workers)\n// Esto evita el error "importScripts() of new scripts after service worker installation is not allowed"\n// NOTA: Si Workbox no está disponible, el service worker seguirá funcionando para push notifications\ntry {\n  importScripts('${workboxUrl}');\n  console.log('[SW] ✅ Workbox cargado correctamente');\n} catch (e) {\n  console.warn('[SW] ⚠️ Workbox no disponible, continuando sin caching avanzado:', e.message);\n  // El service worker continuará funcionando para push notifications\n  // Solo se perderá la funcionalidad de caching de Workbox\n  // Crear un objeto workbox mínimo para evitar errores en el código que lo usa\n  // NO incluir NetworkFirst, NetworkOnly, etc. para que el código detecte que no está disponible\n  if (typeof self.workbox === 'undefined') {\n    self.workbox = {\n      clientsClaim: () => {\n        console.log('[SW] ⚠️ clientsClaim llamado pero Workbox no disponible');\n      },\n      registerRoute: () => {\n        console.log('[SW] ⚠️ registerRoute llamado pero Workbox no disponible');\n      },\n      // NO incluir NetworkFirst, NetworkOnly, etc. para que isWorkboxAvailable detecte que no está disponible\n    };\n  }\n}\n`;
      
      if (!hasWorkboxLoad || !hasErrorHandling) {
        // Si ya existe pero no tiene manejo de errores, reemplazarlo
        if (hasWorkboxLoad && !hasErrorHandling) {
          // Buscar y reemplazar el bloque de importScripts existente (más flexible)
          const importScriptsPattern = /\/\/ Cargar Workbox síncronamente[\s\S]*?\/\/ Esto evita el error[\s\S]*?importScripts\([^)]+\);/;
          if (importScriptsPattern.test(swContent)) {
            swContent = swContent.replace(importScriptsPattern, syncLoadCode.trim());
            console.log('✅ Código de carga de Workbox actualizado con manejo de errores');
          } else {
            // Intentar un patrón más simple
            const simplePattern = /importScripts\('\/workbox-[^']+\.js'\);/;
            if (simplePattern.test(swContent)) {
              swContent = swContent.replace(simplePattern, syncLoadCode.trim().replace(/^[\s\S]*?importScripts/, 'importScripts'));
              // Insertar los comentarios antes
              const insertPos = swContent.indexOf('importScripts');
              if (insertPos > 0) {
                const commentBlock = syncLoadCode.split('importScripts')[0];
                swContent = swContent.slice(0, insertPos) + commentBlock + swContent.slice(insertPos);
              }
              console.log('✅ Código de carga de Workbox actualizado con manejo de errores (patrón simple)');
            }
          }
        } else if (!hasWorkboxLoad) {
          // Insertar carga síncrona de Workbox justo después de los comentarios de copyright
          const copyrightEnd = swContent.indexOf('*/') + 2;
          if (copyrightEnd > 1) {
            swContent = swContent.slice(0, copyrightEnd) + syncLoadCode + swContent.slice(copyrightEnd);
            console.log('✅ Carga síncrona de Workbox insertada al inicio con manejo de errores');
          }
        }
      }
      
      // Modificar singleRequire para que no intente cargar Workbox de forma asíncrona
      // El problema está en que se intenta cargar Workbox dentro de una Promise
      // Buscar el bloque completo de singleRequire manualmente
      const singleRequireStart = swContent.indexOf('const singleRequire = (uri, parentUri) => {');
      if (singleRequireStart !== -1) {
        // Encontrar el cierre del bloque contando las llaves
        let braceCount = 0;
        let inString = false;
        let stringChar = '';
        let i = singleRequireStart;
        while (i < swContent.length) {
          const char = swContent[i];
          if (!inString && (char === '"' || char === "'" || char === '`')) {
            inString = true;
            stringChar = char;
          } else if (inString && char === stringChar && swContent[i - 1] !== '\\') {
            inString = false;
          } else if (!inString) {
            if (char === '{') braceCount++;
            if (char === '}') {
              braceCount--;
              if (braceCount === 0) {
                // Encontramos el cierre
                const singleRequireEnd = i + 1;
                const oldSingleRequire = swContent.substring(singleRequireStart, singleRequireEnd);
                
                // Reemplazar con una versión que no intente cargar Workbox de forma asíncrona
                const modifiedSingleRequire = `const singleRequire = (uri, parentUri) => {
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
            reject(new Error(\`Cannot load \${uri} asynchronously in service worker. importScripts() must be called synchronously during service worker installation.\`));
          }
        }
      })
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(\`Module \${uri} didn't register its module\`);
        }
        return promise;
      })
    );
  };`;
                
                // Reemplazar el bloque antiguo con el nuevo
                swContent = swContent.substring(0, singleRequireStart) + modifiedSingleRequire + swContent.substring(singleRequireEnd);
                console.log('✅ singleRequire modificado para evitar carga asíncrona de Workbox');
                break; // Salir del bucle una vez que encontramos y reemplazamos
              }
            }
          }
          i++;
        }
      }
    }

    // Verificar si el código ya está inyectado
    if (swContent.includes('Push Notifications')) {
      console.log('✅ Código de push notifications ya está presente en sw.js');
      // Aún así, escribir el archivo con la ruta corregida
      fs.writeFileSync(SW_PATH, swContent, 'utf8');
      return;
    }

    // Buscar el final del código de Workbox (el cierre del define)
    // El código de Workbox termina con })); 
    // IMPORTANTE: Inyectar el código DESPUÉS del cierre del define para que se ejecute siempre
    const lastBraceIndex = swContent.lastIndexOf('}));');
    
    if (lastBraceIndex === -1) {
      console.error('❌ No se pudo encontrar el final del código de Workbox');
      return;
    }

    // Inyectar el código DESPUÉS del cierre del define (no antes)
    // Esto asegura que las push notifications se ejecuten siempre, incluso si Workbox falla
    const beforeClose = swContent.substring(0, lastBraceIndex + 4); // +4 para incluir '}));'
    const afterClose = swContent.substring(lastBraceIndex + 4);
    
    // Agregar comentario explicativo
    const pushCodeWithComment = '\n\n// Push Notifications - FUERA del bloque define para que se ejecute siempre\n// Esto asegura que las notificaciones funcionen incluso si Workbox falla\n' + PUSH_NOTIFICATIONS_CODE;
    
    swContent = beforeClose + pushCodeWithComment + '\n\n' + afterClose;

    // Escribir el archivo actualizado
    fs.writeFileSync(SW_PATH, swContent, 'utf8');
    
    console.log('✅ Código de push notifications inyectado exitosamente en sw.js');
  } catch (error) {
    console.error('❌ Error inyectando código de push notifications:', error);
    process.exit(1);
  }
}

// Ejecutar solo si se llama directamente
if (require.main === module) {
  injectPushNotifications();
}

module.exports = injectPushNotifications;

