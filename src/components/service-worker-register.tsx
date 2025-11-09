"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registerServiceWorker = async () => {
      try {
        // Verificar si el archivo sw.js existe antes de intentar registrarlo
        try {
          const response = await fetch("/sw.js", { method: "HEAD" });
          if (!response.ok) {
            if (process.env.NODE_ENV === "development") {
              // Silencioso en desarrollo
              return;
            } else {
              console.warn("⚠️ Service Worker no encontrado. Ejecuta 'npm run build' para generarlo.");
            }
            return;
          }
        } catch {
          if (process.env.NODE_ENV === "development") {
            // Silencioso en desarrollo
            return;
          } else {
            console.warn("⚠️ Service Worker no encontrado. Ejecuta 'npm run build' para generarlo.");
          }
          return;
        }

              // Intentar registrar el service worker principal (Workbox)
              const registration = await navigator.serviceWorker.register("/sw.js", {
                scope: "/",
              });

              console.log("✅ Service Worker registrado:", registration.scope);

              // También registrar el service worker de push notifications si existe
              // (solo en desarrollo, en producción next-pwa maneja todo)
              if (process.env.NODE_ENV === 'development') {
                try {
                  const pushSwResponse = await fetch("/sw-push.js", { method: "HEAD" });
                  if (pushSwResponse.ok) {
                    // El código de push notifications se puede agregar al service worker principal
                    // o usar un service worker adicional
                    console.log("✅ Service Worker de push notifications disponible");
                  }
                } catch (e) {
                  // Silencioso si no existe
                }
              }
      } catch (error) {
        // Silenciar errores para no interferir con la instalación
        if (process.env.NODE_ENV !== "development") {
          console.error("❌ Error al registrar Service Worker:", error);
        }
      }
    };

    // Registrar inmediatamente cuando la página esté lista (sin delay para PWA)
    if (document.readyState === "complete" || document.readyState === "interactive") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker, { once: true });
      // También intentar cuando DOMContentLoaded para ser más rápido
      document.addEventListener("DOMContentLoaded", registerServiceWorker, { once: true });
    }
  }, []);

  return null;
}

