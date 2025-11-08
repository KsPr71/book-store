"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Primero, limpiar service workers antiguos o no registrados
        const registrations = await navigator.serviceWorker.getRegistrations();
        
        // Desregistrar service workers que no están activos o tienen errores
        for (const registration of registrations) {
          if (registration.active?.state === "redundant" || !registration.active) {
            console.log("🧹 Limpiando service worker antiguo:", registration.scope);
            await registration.unregister();
          }
        }

        // Verificar si el archivo sw.js existe antes de intentar registrarlo
        try {
          const response = await fetch("/sw.js", { method: "HEAD" });
          if (!response.ok) {
            if (process.env.NODE_ENV === "development") {
              console.warn("⚠️ Service Worker no disponible en desarrollo (esto es normal)");
            } else {
              console.warn("⚠️ Service Worker no encontrado. Ejecuta 'npm run build' para generarlo.");
            }
            return;
          }
        } catch {
          if (process.env.NODE_ENV === "development") {
            console.warn("⚠️ Service Worker no disponible en desarrollo (esto es normal)");
          } else {
            console.warn("⚠️ Service Worker no encontrado. Ejecuta 'npm run build' para generarlo.");
          }
          return;
        }

        // Intentar registrar el service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("✅ Service Worker registrado:", registration.scope);

        // Verificar estado del service worker
        if (registration.active) {
          console.log("✅ Service Worker activo");
        } else if (registration.installing) {
          console.log("⏳ Service Worker instalándose...");
          registration.installing.addEventListener("statechange", (e) => {
            const worker = e.target as ServiceWorker;
            console.log("🔄 Estado del Service Worker:", worker.state);
          });
        } else if (registration.waiting) {
          console.log("⏸️ Service Worker en espera");
        }

        // Verificar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Cada hora

        // Escuchar actualizaciones del service worker
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (
                newWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                // Hay una nueva versión disponible
                console.log("🔄 Nueva versión del Service Worker disponible");
                // Opcional: mostrar notificación al usuario
                if (
                  window.confirm(
                    "Hay una nueva versión disponible. ¿Deseas recargar la página?"
                  )
                ) {
                  window.location.reload();
                }
              }
            });
          }
        });
      } catch (error) {
        console.error("❌ Error al registrar Service Worker:", error);
        
        // Si hay un error, intentar limpiar todos los service workers
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            await registration.unregister();
            console.log("🧹 Service worker desregistrado:", registration.scope);
          }
        } catch (cleanupError) {
          console.error("❌ Error al limpiar service workers:", cleanupError);
        }
      }
    };

    // Registrar cuando la página esté cargada
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
    }

    // Manejar mensajes del service worker
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("📨 Mensaje del Service Worker:", event.data);
    });

    // Verificar si hay un service worker activo
    if (navigator.serviceWorker.controller) {
      console.log("✅ Service Worker ya está controlando la página");
    }
  }, []);

  return null;
}

