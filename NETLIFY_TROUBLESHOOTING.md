# Guía de Troubleshooting para Netlify

## Cómo Obtener los Logs del Error

### Paso 1: Acceder a los Logs en Netlify

1. Ve a tu dashboard de Netlify
2. Selecciona tu sitio
3. Ve a **"Site deploys"** o **"Deploys"**
4. Haz clic en el deploy que falló
5. Haz clic en **"Logs"** o **"View logs"**
6. Busca las líneas alrededor del primer error (generalmente aparecen en rojo)

### Paso 2: Copiar las Líneas del Error

Copia **las primeras 20-50 líneas** que muestren:
- El mensaje de error principal
- El stack trace
- El nombre del archivo que está causando el problema
- Cualquier referencia a módulos faltantes

**Ejemplo de lo que necesitamos:**
```
Error: Cannot find module 'X'
    at /path/to/file.js:10:5
    ...
```

## Problemas Comunes y Soluciones

### 1. Error: "Cannot find module" o "Failed to resolve import"

**Causa**: Una dependencia no está en `package.json` o no está en `dependencies` (está en `devDependencies`)

**Solución**:
```bash
# Verificar que la dependencia esté en dependencies
npm install --save <nombre-del-paquete>

# Commit y push
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

### 2. Error relacionado con `@vercel/analytics` o `@vercel/speed-insights`

**Causa**: Estos paquetes están diseñados para Vercel y pueden causar problemas en Netlify

**Solución**: Hacer imports condicionales o deshabilitarlos en Netlify

En `next.config.ts`:
```typescript
const nextConfig: NextConfig = {
  // ... otras configuraciones
  // Deshabilitar Vercel Analytics en Netlify
  ...(process.env.NETLIFY === 'true' ? {
    // Configuraciones específicas para Netlify
  } : {}),
};
```

### 3. Error relacionado con `next-pwa`

**Causa**: `next-pwa` puede generar archivos que Netlify intenta empaquetar

**Solución temporal**: Deshabilitar PWA en Netlify

En `netlify.toml`:
```toml
[build.environment]
  DISABLE_PWA = "true"
```

En `next.config.ts`:
```typescript
const pwaConfig = withPWA({
  disable: process.env.DISABLE_PWA === 'true' || process.env.NODE_ENV === 'development',
  // ... resto de configuración
});
```

### 4. Error relacionado con `web-push`

**Causa**: Aunque `web-push` es JavaScript puro, puede tener dependencias que causan problemas

**Verificación**:
- ✅ Ya está en `dependencies` (correcto)
- Si el error persiste, puede necesitar ser marcado como externo

### 5. Error relacionado con `sharp`

**Causa**: `sharp` es un módulo nativo que no puede empaquetarse en funciones serverless

**Solución**: 
- `sharp` solo se usa en scripts de build (`generate-icons.js`)
- No debería afectar las funciones serverless
- Si aparece el error, verifica que el script no se esté ejecutando en el contexto de funciones

### 6. Error: "Module not found: Can't resolve '@/lib/...'"

**Causa**: Problema con path aliases de TypeScript/Next.js

**Solución**: Verificar que `tsconfig.json` tenga los paths correctos:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## Verificación Rápida

Ejecuta estos comandos para verificar dependencias:

```bash
# Verificar que todas las dependencias usadas en API routes estén en dependencies
grep -r "import\|require" src/app/api --include="*.ts" | grep -v "node_modules" | grep -E "from ['\"]|require\(['\"]"

# Verificar dependencias nativas problemáticas
npm ls | grep -E "sharp|bcrypt|sqlite|native"
```

## Comandos para Diagnosticar Localmente

```bash
# Instalar Netlify CLI
npm i -g netlify-cli

# Ejecutar build con debug
NETLIFY_BUILD_DEBUG=true netlify build

# Esto mostrará el error detallado
```

## Qué Hacer Ahora

1. **Copia los logs del error** de Netlify (primeras 20-50 líneas del error)
2. **Pega los logs aquí** para que pueda identificar el problema exacto
3. **Aplicaremos la solución específica** según el error

## Archivos a Verificar

- ✅ `package.json` - Todas las dependencias usadas en API routes deben estar en `dependencies`
- ✅ `netlify.toml` - Configuración correcta
- ✅ `next.config.ts` - Modo standalone para Netlify
- ✅ `tsconfig.json` - Path aliases correctos

