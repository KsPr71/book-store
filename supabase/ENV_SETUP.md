# Configuración de Variables de Entorno

## 📍 Dónde Revisar las Claves de Supabase

### En el Dashboard de Supabase:

1. **Accede a tu proyecto**: https://app.supabase.com
2. **Ve a Settings → API** (o **Configuración → API**)
3. **Encontrarás tres valores importantes**:
   - **Project URL** - Tu URL del proyecto
   - **anon public** - Clave pública anónima (segura para el cliente)
   - **service_role** - Clave de servicio (solo para servidor, NUNCA exponer)

## 🔑 Variables Necesarias

Crea un archivo `.env.local` en la raíz del proyecto con:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon_public_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui
```

## 📂 Ubicación de los Archivos

### Localmente (Desarrollo)
- **Archivo**: `.env.local` (en la raíz del proyecto, junto a `package.json`)
- **Estado**: Este archivo está en `.gitignore` y NO se sube a Git

### En Supabase Dashboard
- **Ruta**: Settings → API
- **URL directa**: `https://app.supabase.com/project/[TU_PROJECT_ID]/settings/api`

### En Producción (Vercel)
- **Ruta**: Project Settings → Environment Variables
- Configura las mismas variables allí

### En Producción (Netlify)
- **Ruta**: Site Settings → Environment Variables

## ⚠️ Importante de Seguridad

1. **NUNCA** subas `.env.local` a Git (ya está en `.gitignore`)
2. **NUNCA** expongas `SUPABASE_SERVICE_ROLE_KEY` en el cliente
3. Solo usa `NEXT_PUBLIC_` para variables que necesites en el navegador
4. La clave `service_role` bypassa RLS (Row Level Security), úsala con cuidado

## 🚀 Ejemplo de Uso

```typescript
// En tu código Next.js
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Solo en API routes o Server Components:
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
```

## 📝 Notas

- Reinicia el servidor de desarrollo (`npm run dev`) después de crear/modificar `.env.local`
- Las variables con `NEXT_PUBLIC_` están disponibles tanto en cliente como servidor
- Las variables sin `NEXT_PUBLIC_` solo están disponibles en el servidor

