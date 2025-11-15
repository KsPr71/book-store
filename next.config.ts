import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.storage',
      },
      // Permitir cualquier dominio (útil para desarrollo)
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    // Permitir imágenes no optimizadas para desarrollo
    unoptimized: false,
  },
  // Configuración de Turbopack (vacía para permitir que next-pwa use webpack)
  turbopack: {},
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Deshabilitar en desarrollo para evitar regeneración múltiple
  buildExcludes: [/middleware-manifest\.json$/],
  runtimeCaching: [
    {
      // Regla específica para Supabase Storage - debe ir ANTES de la regla general de imágenes
      // Usa StaleWhileRevalidate para servir cache mientras actualiza en segundo plano
      urlPattern: /^https:\/\/.*\.supabase\.(co|in|storage)\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'supabase-images',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 30, // 30 minutos (muy reducido para forzar actualizaciones frecuentes)
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Regla general para otras imágenes (excluyendo Supabase)
      urlPattern: /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/_next\/static\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'next-static',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 año
        },
      },
    },
    {
      urlPattern: /^https?:\/\/.*\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5, // 5 minutos
        },
        networkTimeoutSeconds: 30, // Aumentado de 10 a 30 segundos
      },
    },
  ],
});

export default pwaConfig(nextConfig);
