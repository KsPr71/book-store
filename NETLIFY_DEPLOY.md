# Guía de Despliegue en Netlify

## Configuración Realizada

1. ✅ Instalado `@netlify/plugin-nextjs`
2. ✅ Creado `netlify.toml` con configuración básica
3. ✅ Configurado `next.config.ts` para modo standalone en Netlify

## Pasos para Diagnosticar el Error

Si aún tienes el error de bundling, ejecuta localmente:

```bash
# Instalar Netlify CLI globalmente
npm i -g netlify-cli

# Ejecutar build con debug
NETLIFY_BUILD_DEBUG=true netlify build
```

Esto mostrará el error detallado que identifica el archivo y módulo problemático.

## Posibles Soluciones

### 1. Si el error menciona `web-push`:

`web-push` es JavaScript puro y no debería causar problemas. Si aparece el error, verifica que esté en `dependencies` (no `devDependencies`).

### 2. Si el error menciona `sharp`:

`sharp` es un módulo nativo. Netlify no puede empaquetarlo en funciones serverless. Soluciones:

- **Opción A**: Mover `sharp` a `dependencies` (ya está en devDependencies)
- **Opción B**: El script `generate-icons.js` solo se ejecuta durante el build, no debería afectar las funciones

### 3. Si el error menciona `next-pwa`:

`next-pwa` puede generar archivos que Netlify intenta empaquetar. Solución:

Deshabilitar PWA en Netlify temporalmente para verificar:

```toml
[build.environment]
  DISABLE_PWA = "true"
```

Y en `next.config.ts`:

```typescript
const pwaConfig = withPWA({
  disable: process.env.DISABLE_PWA === 'true' || process.env.NODE_ENV === 'development',
  // ... resto de configuración
});
```

### 4. Si el error es sobre módulos faltantes:

Asegúrate de que todas las dependencias usadas en las API routes estén en `dependencies`, no en `devDependencies`.

## Verificación de Dependencias

Revisa que estas dependencias estén en `dependencies`:
- ✅ `web-push` - Ya está en dependencies
- ✅ `@supabase/supabase-js` - Ya está en dependencies
- ⚠️ `sharp` - Está en devDependencies (solo se usa en scripts de build)

## Comandos Útiles

```bash
# Verificar qué módulos están siendo importados en las API routes
grep -r "import\|require" src/app/api --include="*.ts" | grep -v "node_modules"

# Verificar dependencias nativas
npm ls | grep -E "sharp|bcrypt|sqlite|native"
```

## Próximos Pasos

1. Ejecuta `NETLIFY_BUILD_DEBUG=true netlify build` localmente
2. Copia el error completo
3. Identifica el archivo y módulo mencionado en el error
4. Aplica la solución correspondiente según el caso arriba

