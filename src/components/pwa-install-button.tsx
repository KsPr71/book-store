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
    const isNavigatorStandalone = (window.navigator as any).standalone === true;
    const isInWebAppiOS = window.matchMedia("(display-mode: standalone)").matches || 
                          (window.navigator as any).standalone === true;
    
    return isStandalone || isNavigatorStandalone || isInWebAppiOS;
  };

  useEffect(() => {
    // Verificar si ya está instalada
    if (checkIfInstalled()) {
      setIsInstalled(true);
      setShowButton(false);
      return;
    }

    const handler = (e: Event) => {
      // Prevenir que el banner automático aparezca
      e.preventDefault();
      // Guardar el evento para usarlo más tarde
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  // Escuchar cuando la app se instala
  useEffect(() => {
    const handleAppInstalled = () => {
      console.log("✅ App instalada");
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

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      console.error("No hay prompt de instalación disponible");
      setInstallState("error");
      return;
    }

    // Guardar una referencia local del prompt antes de usarlo
    const prompt = deferredPrompt;

    try {
      // Mostrar el prompt de instalación
      await prompt.prompt();

      // Esperar a que el usuario responda
      const { outcome } = await prompt.userChoice;

      // Limpiar el prompt después de usarlo (importante para móviles)
      setDeferredPrompt(null);

      if (outcome === "accepted") {
        console.log("✅ Usuario aceptó instalar la app");
        setInstallState("installing");
        // El evento 'appinstalled' se disparará cuando se complete la instalación
      } else {
        console.log("❌ Usuario rechazó instalar la app");
        setInstallState("idle");
        // El prompt ya fue limpiado, no se puede usar de nuevo
      }
    } catch (error) {
      console.error("❌ Error al instalar la app:", error);
      setInstallState("error");
      // Limpiar el prompt si hay error
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

