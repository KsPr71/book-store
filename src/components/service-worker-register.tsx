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
        } else if (registration.waiting) {
          console.log("⏸️ Service Worker en espera");
        }

        // Verificar actualizaciones periódicamente (solo si está activo)
        if (registration.active) {
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Cada hora
        }
      } catch (error) {
        console.error("❌ Error al registrar Service Worker:", error);
      }
    };

    // Registrar cuando la página esté cargada
    if (document.readyState === "complete") {
      registerServiceWorker();
    } else {
      window.addEventListener("load", registerServiceWorker);
    }
  }, []);

  return null;
}

