# Configuración de Vercel Analytics en el Dashboard

Para visualizar las analytics de Vercel en el panel de administración, necesitas configurar las siguientes variables de entorno.

## Variables de Entorno Requeridas

Agrega estas variables en tu archivo `.env.local` o en la configuración de Vercel:

```env
VERCEL_TOKEN=tu_token_de_vercel
VERCEL_PROJECT_ID=tu_project_id
VERCEL_TEAM_ID=tu_team_id  # Opcional, solo si trabajas con un equipo
```

## Cómo Obtener las Credenciales

### 1. Obtener VERCEL_TOKEN

1. Ve a [Vercel Account Settings](https://vercel.com/account/tokens)
2. Haz clic en "Create Token"
3. Dale un nombre descriptivo (ej: "Analytics Dashboard")
4. Selecciona el scope apropiado (al menos `read` para analytics)
5. Copia el token generado

### 2. Obtener VERCEL_PROJECT_ID

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Ve a "Settings" → "General"
3. En la sección "Project ID", copia el ID

### 3. Obtener VERCEL_TEAM_ID (Opcional)

1. Si trabajas con un equipo, ve a [Team Settings](https://vercel.com/teams)
2. Selecciona tu equipo
3. El Team ID está en la URL o en la configuración del equipo

## Configuración en Vercel

Si estás desplegando en Vercel, puedes agregar estas variables en:

1. Ve a tu proyecto en Vercel
2. Settings → Environment Variables
3. Agrega cada variable con su valor correspondiente

## Nota sobre la API de Vercel

La API de Vercel Analytics puede tener diferentes endpoints según la versión. El código actual usa un endpoint básico. Si necesitas ajustar el endpoint, revisa la [documentación oficial de Vercel API](https://vercel.com/docs/rest-api).

## Alternativa: Ver Analytics Directamente

Si prefieres no configurar la API, siempre puedes ver las analytics directamente en el [Dashboard de Vercel](https://vercel.com/dashboard), donde encontrarás métricas más detalladas y en tiempo real.

