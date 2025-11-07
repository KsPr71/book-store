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

    // Apple Touch Icons para iOS (múltiples tamaños)
    const appleIcon180 = document.createElement("link");
    appleIcon180.rel = "apple-touch-icon";
    appleIcon180.href = "/logo2.svg";
    appleIcon180.sizes = "180x180";
    document.head.appendChild(appleIcon180);

    const appleIcon152 = document.createElement("link");
    appleIcon152.rel = "apple-touch-icon";
    appleIcon152.href = "/logo2.svg";
    appleIcon152.sizes = "152x152";
    document.head.appendChild(appleIcon152);

    const appleIcon144 = document.createElement("link");
    appleIcon144.rel = "apple-touch-icon";
    appleIcon144.href = "/logo2.svg";
    appleIcon144.sizes = "144x144";
    document.head.appendChild(appleIcon144);

    const appleIcon120 = document.createElement("link");
    appleIcon120.rel = "apple-touch-icon";
    appleIcon120.href = "/logo2.svg";
    appleIcon120.sizes = "120x120";
    document.head.appendChild(appleIcon120);

    const appleIcon114 = document.createElement("link");
    appleIcon114.rel = "apple-touch-icon";
    appleIcon114.href = "/logo2.svg";
    appleIcon114.sizes = "114x114";
    document.head.appendChild(appleIcon114);

    const appleIcon76 = document.createElement("link");
    appleIcon76.rel = "apple-touch-icon";
    appleIcon76.href = "/logo2.svg";
    appleIcon76.sizes = "76x76";
    document.head.appendChild(appleIcon76);

    const appleIcon72 = document.createElement("link");
    appleIcon72.rel = "apple-touch-icon";
    appleIcon72.href = "/logo2.svg";
    appleIcon72.sizes = "72x72";
    document.head.appendChild(appleIcon72);

    const appleIcon57 = document.createElement("link");
    appleIcon57.rel = "apple-touch-icon";
    appleIcon57.href = "/logo2.svg";
    appleIcon57.sizes = "57x57";
    document.head.appendChild(appleIcon57);

    // Apple meta tags
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
      const elements = [
        manifestLink,
        themeColor,
        appleIcon180,
        appleIcon152,
        appleIcon144,
        appleIcon120,
        appleIcon114,
        appleIcon76,
        appleIcon72,
        appleIcon57,
        appleCapable,
        appleStatusBar,
        appleTitle,
      ];
      elements.forEach((el) => {
        if (el.parentNode) {
          el.parentNode.removeChild(el);
        }
      });
    };
  }, []);

  return null;
}

