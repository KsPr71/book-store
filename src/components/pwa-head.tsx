"use client";

import { useEffect } from "react";

export function PWAHead() {
  useEffect(() => {
    // Agregar links y meta tags para PWA
    const manifestLink = document.createElement("link");
    manifestLink.rel = "manifest";
    manifestLink.href = "/manifest.json";
    document.head.appendChild(manifestLink);

    const themeColor = document.createElement("meta");
    themeColor.name = "theme-color";
    themeColor.content = "#3b82f6";
    document.head.appendChild(themeColor);

    const appleCapable = document.createElement("meta");
    appleCapable.name = "apple-mobile-web-app-capable";
    appleCapable.content = "yes";
    document.head.appendChild(appleCapable);

    const appleStatusBar = document.createElement("meta");
    appleStatusBar.name = "apple-mobile-web-app-status-bar-style";
    appleStatusBar.content = "default";
    document.head.appendChild(appleStatusBar);

    const appleTitle = document.createElement("meta");
    appleTitle.name = "apple-mobile-web-app-title";
    appleTitle.content = "Book Store";
    document.head.appendChild(appleTitle);

    // Cleanup
    return () => {
      document.head.removeChild(manifestLink);
      document.head.removeChild(themeColor);
      document.head.removeChild(appleCapable);
      document.head.removeChild(appleStatusBar);
      document.head.removeChild(appleTitle);
    };
  }, []);

  return null;
}

