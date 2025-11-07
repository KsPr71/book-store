import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verificar si hay variables de entorno configuradas
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProjectId = process.env.VERCEL_PROJECT_ID;
    const vercelTeamId = process.env.VERCEL_TEAM_ID;

    if (!vercelToken || !vercelProjectId) {
      return NextResponse.json(
        {
          error: "Vercel Analytics no está configurado",
          message: "Se requieren VERCEL_TOKEN y VERCEL_PROJECT_ID en las variables de entorno",
        },
        { status: 503 }
      );
    }

    // Construir la URL de la API de Vercel
    const baseUrl = vercelTeamId
      ? `https://vercel.com/api/v1/teams/${vercelTeamId}/projects/${vercelProjectId}/analytics`
      : `https://vercel.com/api/v1/projects/${vercelProjectId}/analytics`;

    // Obtener datos de analytics de Vercel
    // Nota: La API de Vercel Analytics puede requerir diferentes endpoints
    // Este es un ejemplo básico. Puedes ajustar según la documentación de Vercel
    
    const response = await fetch(`${baseUrl}?since=7d`, {
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Transformar los datos al formato esperado
    const analyticsData = {
      pageviews: data.pageviews || 0,
      visitors: data.visitors || 0,
      topPages: data.topPages || [],
      referrers: data.referrers || [],
      devices: data.devices || [],
      countries: data.countries || [],
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Error fetching Vercel Analytics:", error);
    
    // Retornar datos vacíos en caso de error para que el componente muestre el mensaje de configuración
    return NextResponse.json(
      {
        error: "Error al obtener analytics",
        message: error instanceof Error ? error.message : "Error desconocido",
        pageviews: 0,
        visitors: 0,
        topPages: [],
        referrers: [],
        devices: [],
        countries: [],
      },
      { status: 500 }
    );
  }
}

