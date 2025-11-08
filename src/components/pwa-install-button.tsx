"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type InstallState = "idle" | "installing" | "installed" | "error";

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showButton, setShowButton] = useState(false);
  const [installState, setInstallState] = useState<InstallState>("idle");
  const [isInstalled, setIsInstalled] = useState(false);

  // Verificar si la app está instalada
  const checkIfInstalled = () => {
    // Verificar múltiples formas de detectar si está instalada
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isNavigatorStandalone = (window.navigator as { standalone?: boolean }).standalone === true;
    
    // En móviles, también verificar si está en modo fullscreen o standalone
    const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
    // Nota: NO usamos la presencia de un service worker como indicador de "instalada" porque
    // en muchos escenarios el SW puede estar registrado aunque la app no esté instalada.
    // (Ej: PWA en navegador con SW para caching). Usar solo display-mode / navigator.standalone.
    const installed = isStandalone || isNavigatorStandalone || isFullscreen;
    // Debug: loguear las detecciones para ayudar a diagnosticar en móviles
    if (process.env.NODE_ENV === 'development') {
      console.log('PWA install check:', { isStandalone, isNavigatorStandalone, isFullscreen, installed });
    }
    return installed;
  };

  useEffect(() => {
    // Verificar si ya está instalada (usar setTimeout para evitar setState síncrono)
    if (checkIfInstalled()) {
      setTimeout(() => {
        setIsInstalled(true);
        setShowButton(false);
      }, 0);
      return;
    }

    const handler = (e: Event) => {
      // Prevenir que el banner automático aparezca
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      const promptEvent = e as BeforeInstallPromptEvent;
      console.log("📱 Evento beforeinstallprompt capturado");
      setDeferredPrompt(promptEvent);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Escuchar cuando la app se instala
  useEffect(() => {
    const handleAppInstalled = (e: Event) => {
      console.log("✅ Evento appinstalled disparado", e);
      setIsInstalled(true);
      setShowButton(false);
      setInstallState("installed");
      setDeferredPrompt(null);
    };

    // También verificar periódicamente si se instaló (por si el evento no se dispara)
    const periodicCheck = setInterval(() => {
      if (checkIfInstalled() && !isInstalled) {
        console.log("✅ App instalada detectada por verificación periódica");
        setIsInstalled(true);
        setShowButton(false);
        setInstallState("installed");
        setDeferredPrompt(null);
        clearInterval(periodicCheck);
      }
    }, 2000); // Cada 2 segundos

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearInterval(periodicCheck);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.error("No hay prompt de instalación disponible");
      return;
    }

    // Guardar referencia local del prompt
    const prompt = deferredPrompt;

    try {
      console.log("📱 Mostrando prompt de instalación...");
      // Mostrar el prompt de instalación
      // En móviles, esto debe mostrar un diálogo del sistema
      await prompt.prompt();
      console.log("📱 Prompt mostrado, esperando respuesta del usuario...");

      // Esperar a que el usuario responda
      // En móviles, esto puede tardar más tiempo
      const { outcome } = await prompt.userChoice;
      console.log("📱 Usuario respondió:", outcome);

      // Limpiar el prompt después de usarlo (importante)
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        console.log("✅ Usuario aceptó instalar la app");
        setInstallState("installing");
        
        // En móviles, después de aceptar, la app se instala pero la página actual
        // sigue en el navegador, por lo que checkIfInstalled() puede seguir devolviendo false
        // El evento 'appinstalled' debería dispararse, pero a veces no lo hace
        
        // Esperar un momento para que se complete la instalación
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Verificar si se instaló (puede que la página se haya recargado o cambiado)
        if (checkIfInstalled()) {
          console.log("✅ App instalada detectada inmediatamente");
          setIsInstalled(true);
          setShowButton(false);
          setInstallState("installed");
        } else {
          // Si no se detecta, puede que se haya instalado pero la página sigue en navegador
          // En este caso, mostrar mensaje de éxito y ocultar el botón temporalmente
          console.log("✅ Instalación aceptada - La app debería estar instalándose");
          setInstallState("installed");
          setShowButton(false);
          
          // Después de 3 segundos, verificar de nuevo
          setTimeout(() => {
            if (checkIfInstalled()) {
              setIsInstalled(true);
            } else {
              // Si aún no se detecta, puede que necesite recargar
              // Pero asumimos que se instaló si el usuario aceptó
              setIsInstalled(true);
            }
          }, 3000);
        }
      } else {
        console.log("❌ Usuario rechazó instalar la app");
        setInstallState("idle");
      }
    } catch (error) {
      console.error("❌ Error al instalar la app:", error);
      setInstallState("error");
      setDeferredPrompt(null);
    }
  };

  // No mostrar el botón si ya está instalada
  if (isInstalled || !showButton) return null;

  const getButtonText = () => {
    switch (installState) {
      case "installing":
        return "Instalando...";
      case "installed":
        return "Instalada";
      case "error":
        return "Error - Intentar de nuevo";
      default:
        return "Instalar App";
    }
  };

  const getButtonClass = () => {
    const baseClass = "fixed bottom-4 left-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-white shadow-lg transition-colors duration-200";
    
    switch (installState) {
      case "installing":
        return `${baseClass} bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/50 cursor-wait`;
      case "installed":
        return `${baseClass} bg-green-600 hover:bg-green-700 shadow-green-500/50`;
      case "error":
        return `${baseClass} bg-red-600 hover:bg-red-700 shadow-red-500/50`;
      default:
        return `${baseClass} bg-blue-600 hover:bg-blue-700 shadow-blue-500/50`;
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      disabled={installState === "installed"}
      className={getButtonClass()}
      aria-label="Instalar aplicación"
    >
      {installState === "installing" ? (
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )}
      <span className="font-medium">{getButtonText()}</span>
    </button>
  );
}

