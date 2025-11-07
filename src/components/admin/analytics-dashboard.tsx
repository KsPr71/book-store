"use client";

import { useEffect, useState } from "react";

interface AnalyticsData {
  pageviews: number;
  visitors: number;
  topPages: Array<{ path: string; views: number }>;
  referrers: Array<{ source: string; views: number }>;
  devices: Array<{ device: string; views: number }>;
  countries: Array<{ country: string; views: number }>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/analytics");
      if (!response.ok) {
        throw new Error("Error al obtener analytics");
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      // Datos de ejemplo para desarrollo
      setData({
        pageviews: 0,
        visitors: 0,
        topPages: [],
        referrers: [],
        devices: [],
        countries: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-lg text-neutral-600 dark:text-neutral-400">
          Cargando analytics...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Configuración Requerida
        </h3>
        <p className="text-yellow-700 dark:text-yellow-300 mb-4">
          Para ver las analytics de Vercel en este dashboard, necesitas configurar las variables de entorno:
        </p>
        <ul className="list-disc list-inside text-yellow-700 dark:text-yellow-300 space-y-2 mb-4">
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">VERCEL_TOKEN</code> - Token de acceso de Vercel</li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">VERCEL_TEAM_ID</code> - ID del equipo (opcional)</li>
          <li><code className="bg-yellow-100 dark:bg-yellow-900/40 px-2 py-1 rounded">VERCEL_PROJECT_ID</code> - ID del proyecto</li>
        </ul>
        <p className="text-yellow-700 dark:text-yellow-300">
          Mientras tanto, puedes ver las analytics directamente en el{" "}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Dashboard de Vercel
          </a>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Vistas de Página
          </h3>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {data?.pageviews.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Visitantes Únicos
          </h3>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {data?.visitors.toLocaleString() || "0"}
          </p>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Páginas Populares
          </h3>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {data?.topPages.length || 0}
          </p>
        </div>
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">
            Fuentes de Tráfico
          </h3>
          <p className="text-3xl font-bold text-neutral-900 dark:text-white">
            {data?.referrers.length || 0}
          </p>
        </div>
      </div>

      {/* Páginas más visitadas */}
      {data && data.topPages.length > 0 && (
        <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
            Páginas Más Visitadas
          </h3>
          <div className="space-y-2">
            {data.topPages.map((page, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg"
              >
                <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                  {page.path}
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold">
                  {page.views.toLocaleString()} vistas
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispositivos */}
      {data && data.devices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
              Dispositivos
            </h3>
            <div className="space-y-3">
              {data.devices.map((device, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {device.device}
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">
                    {device.views.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Países */}
          {data.countries.length > 0 && (
            <div className="bg-white dark:bg-gradient-to-br dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 rounded-lg shadow-md p-6 border border-neutral-200 dark:border-blue-500">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Países
              </h3>
              <div className="space-y-3">
                {data.countries.slice(0, 10).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-neutral-700 dark:text-neutral-300">
                      {country.country}
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">
                      {country.views.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">
          📊 Analytics de Vercel
        </h3>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Los datos se actualizan automáticamente desde Vercel Analytics. Para ver métricas más detalladas y en tiempo real, visita el{" "}
          <a
            href="https://vercel.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            Dashboard de Vercel
          </a>
        </p>
        <button
          onClick={fetchAnalytics}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Actualizar Datos
        </button>
      </div>
    </div>
  );
}

