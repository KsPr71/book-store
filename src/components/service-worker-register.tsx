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

        // Intentar registrar el service worker
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("✅ Service Worker registrado:", registration.scope);
      } catch (error) {
        // Silenciar errores para no interferir con la instalación
        if (process.env.NODE_ENV !== "development") {
          console.error("❌ Error al registrar Service Worker:", error);
        }
      }
    };

    // Registrar cuando la página esté cargada (con delay para no interferir)
    const timer = setTimeout(() => {
      if (document.readyState === "complete") {
        registerServiceWorker();
      } else {
        window.addEventListener("load", registerServiceWorker);
      }
    }, 1000); // Delay de 1 segundo para no interferir con la instalación

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
}

