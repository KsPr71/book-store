"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      // Registrar el service worker solo en producción
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("✅ Service Worker registrado:", registration.scope);

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
          })
          .catch((error) => {
            console.error("❌ Error al registrar Service Worker:", error);
          });
      });

      // Manejar mensajes del service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        console.log("📨 Mensaje del Service Worker:", event.data);
      });
    }
  }, []);

  return null;
}

