# 🚀 Build de Producción - Push Notifications

## Pasos para el Build de Producción

### 1. Verificar Variables de Entorno

Asegúrate de que todas las variables de entorno estén configuradas en tu plataforma de hosting:

```env
# Claves VAPID (requeridas)
VAPID_PUBLIC_KEY=tu_clave_publica
VAPID_PRIVATE_KEY=tu_clave_privada
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica

# Supabase (ya configuradas)
NEXT_PUBLIC_SUPABASE_URL=tu_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anon
SUPABASE_SERVICE_ROLE_KEY=tu_clave_service
```

### 2. Ejecutar Build

```bash
npm run build
```

Este comando:
1. Genera los iconos
2. Crea el build de Next.js
3. **Inyecta automáticamente el código de push notifications en el service worker**

### 3. Verificar el Service Worker

Después del build, verifica que `public/sw.js` contenga el código de push notifications:

```bash
# Buscar el código de push notifications
grep -i "push event received" public/sw.js
```

Si aparece, el código fue inyectado correctamente.

### 4. Probar en Producción

1. **Desplegar la app** en tu plataforma de hosting (Vercel, Netlify, etc.)
2. **Instalar la PWA** en tu dispositivo móvil
3. **Activar notificaciones** desde la configuración de la app
4. **Suscribirse a push notifications** usando el botón de debug
5. **Crear un libro** desde el panel de administración
6. **Verificar** que recibas la notificación push

## Verificación del Código Inyectado

El script `scripts/inject-push-notifications.js` se ejecuta automáticamente después del build y:

- ✅ Inyecta el código de push notifications en el service worker generado por `next-pwa`
- ✅ Agrega los event listeners para `push` y `notificationclick`
- ✅ Incluye el código del Badge API
- ✅ Mantiene toda la funcionalidad de Workbox

## Troubleshooting

### El código no se inyecta

Si el código no se inyecta automáticamente:

```bash
# Ejecutar manualmente
npm run inject-push
```

### El service worker no se actualiza

1. Desregistra el service worker antiguo en DevTools
2. Recarga la página
3. Verifica que el nuevo service worker se registre

### Las notificaciones no funcionan en producción

1. Verifica que las variables de entorno estén configuradas
2. Verifica que HTTPS esté habilitado (requerido para push notifications)
3. Verifica que la tabla `push_subscriptions` exista en Supabase
4. Revisa los logs del servidor para ver errores

## Notas Importantes

- ⚠️ **HTTPS requerido**: Las push notifications solo funcionan en HTTPS (excepto localhost)
- ⚠️ **Service Worker**: Se regenera en cada build, por eso el script lo inyecta automáticamente
- ⚠️ **Badge API**: Solo funciona cuando la app está instalada como PWA
- ⚠️ **Variables de entorno**: Asegúrate de configurarlas en tu plataforma de hosting

## Checklist Pre-Deploy

- [ ] Variables de entorno configuradas en el hosting
- [ ] Tabla `push_subscriptions` creada en Supabase
- [ ] Build ejecutado exitosamente
- [ ] Service worker contiene código de push notifications
- [ ] HTTPS habilitado en producción
- [ ] PWA instalable (manifest.json correcto)

