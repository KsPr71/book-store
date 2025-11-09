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
    
    // NO usar service worker como indicador de instalación
    // porque puede estar activo sin que la PWA esté instalada
    
    return isStandalone || isNavigatorStandalone || isFullscreen;
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

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Verificar periódicamente si se instaló (especialmente después de aceptar)
  useEffect(() => {
    if (isInstalled) {
      return; // No verificar si ya está instalada
    }

    // Verificar más frecuentemente si está en estado "installing"
    const checkInterval = installState === "installing" ? 500 : 2000;
    const periodicCheck = setInterval(() => {
      if (checkIfInstalled()) {
        console.log("✅ App instalada detectada por verificación periódica");
        setIsInstalled(true);
        setShowButton(false);
        setInstallState("installed");
        setDeferredPrompt(null);
        clearInterval(periodicCheck);
      }
    }, checkInterval);

    return () => {
      clearInterval(periodicCheck);
    };
  }, [installState, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.error("No hay prompt de instalación disponible");
      return;
    }

    // Verificar que el service worker esté activo antes de instalar
    try {
      const registration = await navigator.serviceWorker.ready;
      console.log("✅ Service Worker está listo:", registration.active?.scriptURL);
    } catch (swError) {
      console.warn("⚠️ Service Worker no está listo, esperando...");
      // Esperar un momento para que el service worker se active
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Guardar referencia local del prompt
    const prompt = deferredPrompt;

    try {
      console.log("📱 Mostrando prompt de instalación...");
      setInstallState("installing");
      
      // Mostrar el prompt de instalación
      await prompt.prompt();
      console.log("📱 Prompt mostrado, esperando respuesta del usuario...");

      // Esperar a que el usuario responda
      const { outcome } = await prompt.userChoice;
      console.log("📱 Usuario respondió:", outcome);

      // Limpiar el prompt después de usarlo (importante)
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        console.log("✅ Usuario aceptó instalar la app");
        // El evento 'appinstalled' debería dispararse automáticamente
        // Si no se dispara, el useEffect lo detectará con la verificación periódica
        setInstallState("installing");
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

