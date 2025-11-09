/**
 * Script para inyectar código de push notifications en el service worker generado por next-pwa
 * Se ejecuta después del build para asegurar que el código de push notifications esté presente
 */

const fs = require('fs');
const path = require('path');

const SW_PATH = path.join(__dirname, '../public/sw.js');

// Código de push notifications a inyectar
const PUSH_NOTIFICATIONS_CODE = `
  // Push Notifications
  self.addEventListener('push', (event) => {
    console.log('[SW] Push event received:', event);

    let notificationData = {
      title: '📚 Nuevo libro disponible',
      body: 'Se ha agregado un nuevo libro al catálogo',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'new-book',
      requireInteraction: false,
      data: {},
    };

    if (event.data) {
      try {
        const data = event.data.json();
        console.log('[SW] Parsed push data:', data);
        notificationData = {
          ...notificationData,
          title: data.title || notificationData.title,
          body: data.body || notificationData.body,
          icon: data.icon || notificationData.icon,
          data: data.data || {},
        };
      } catch (e) {
        console.log('[SW] Error parsing JSON, trying text:', e);
        const text = event.data.text();
        if (text) {
          try {
            const data = JSON.parse(text);
            notificationData = {
              ...notificationData,
              title: data.title || notificationData.title,
              body: data.body || notificationData.body,
              icon: data.icon || notificationData.icon,
              data: data.data || {},
            };
          } catch (e2) {
            console.log('[SW] Using text as body:', text);
            notificationData.body = text;
          }
        }
      }
    }

    console.log('[SW] Showing notification with data:', notificationData);

    // Verificar si hay clientes visibles (pestañas abiertas)
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        const hasVisibleClient = clientList.some(client => client.visibilityState === 'visible');
        console.log('[SW] Has visible client:', hasVisibleClient);
        console.log('[SW] Total clients:', clientList.length);
        
        // Mostrar notificación siempre, incluso si hay clientes visibles
        // Algunos navegadores no muestran notificaciones si la pestaña está activa
        const notificationOptions = {
          body: notificationData.body,
          icon: notificationData.icon,
          badge: notificationData.badge,
          tag: notificationData.tag,
          requireInteraction: true, // Forzar interacción para que siempre se muestre
          data: notificationData.data,
          vibrate: [200, 100, 200],
          silent: false, // Asegurar que no esté silenciosa
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

        return self.registration.showNotification(notificationData.title, notificationOptions)
          .then(() => {
            console.log('[SW] ✅ Notification shown successfully');
            console.log('[SW] Notification options:', notificationOptions);
          })
          .catch((error) => {
            console.error('[SW] ❌ Error showing notification:', error);
            console.error('[SW] Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack,
            });
          });
      })
    );

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

    // Verificar si el código ya está inyectado
    if (swContent.includes('Push Notifications')) {
      console.log('✅ Código de push notifications ya está presente en sw.js');
      // Aún así, escribir el archivo con la ruta corregida
      fs.writeFileSync(SW_PATH, swContent, 'utf8');
      return;
    }

    // Buscar el final del código de Workbox (antes del cierre del último bloque)
    // El código de Workbox termina con })); o similar
    const lastBraceIndex = swContent.lastIndexOf('}));');
    
    if (lastBraceIndex === -1) {
      console.error('❌ No se pudo encontrar el final del código de Workbox');
      return;
    }

    // Inyectar el código antes del cierre
    const beforeClose = swContent.substring(0, lastBraceIndex);
    const afterClose = swContent.substring(lastBraceIndex);
    
    swContent = beforeClose + PUSH_NOTIFICATIONS_CODE + '\n\n' + afterClose;

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

