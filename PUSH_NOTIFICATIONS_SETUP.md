# Configuración de Push Notifications

## Variables de Entorno Requeridas

Agrega estas variables a tu archivo `.env.local`:

```env
# Claves VAPID (generadas con: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui

# Email de contacto (opcional, se usa para VAPID)
NEXT_PUBLIC_CONTACT_EMAIL=mailto:tu-email@ejemplo.com
```

**Importante:** 
- `VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` son para el servidor (no deben exponerse al cliente)
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` es para el cliente (debe ser la misma clave pública)

## Base de Datos

Ejecuta la migración SQL para crear la tabla de suscripciones:

```sql
-- Ejecutar en Supabase SQL Editor o usando la CLI
-- Archivo: supabase/migrations/002_push_subscriptions.sql
```

O ejecuta directamente:

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  keys JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);
```

## Cómo Probar

1. **Activar notificaciones:**
   - Ve a la configuración de la app
   - Haz clic en "Activar" notificaciones
   - Acepta los permisos del navegador

2. **Suscribirse a Push Notifications:**
   - Usa el componente de debug (visible en desarrollo)
   - Haz clic en "Suscribir Push"
   - Verifica que aparezca "Push subscription: yes"

3. **Probar notificación push:**
   - En el componente de debug, haz clic en "Enviar push de prueba (server)"
   - Deberías recibir una notificación

4. **Probar con un libro real:**
   - Crea un nuevo libro desde el panel de administración
   - Si el libro tiene estado "available", se enviarán push notifications automáticamente
   - Verifica que recibas la notificación

## Flujo de Funcionamiento

1. **Usuario activa notificaciones:**
   - Se solicita permiso de notificaciones
   - Se crea suscripción a Supabase Realtime (para notificaciones cuando la app está abierta)
   - Se crea suscripción Push (para notificaciones cuando la app está cerrada)

2. **Cuando se crea un libro:**
   - El formulario de creación llama a `/api/notifications/send-push`
   - El servidor obtiene todas las suscripciones de la base de datos
   - Envía push notifications a todos los usuarios suscritos
   - El service worker recibe el push y muestra la notificación

3. **Cuando el usuario hace clic en la notificación:**
   - El service worker abre la URL del libro
   - El usuario es redirigido a la página del libro

## Troubleshooting

### Las notificaciones no se muestran
- Verifica que las claves VAPID estén configuradas correctamente
- Verifica que el service worker esté registrado (consola del navegador)
- Verifica que la tabla `push_subscriptions` exista y tenga datos
- Revisa la consola del servidor para ver errores

### Error "VAPID keys not configured"
- Asegúrate de que las variables de entorno estén en `.env.local`
- Reinicia el servidor de desarrollo después de agregar las variables
- Verifica que los nombres de las variables sean exactamente como se muestran arriba

### Las notificaciones funcionan en desarrollo pero no en producción
- Asegúrate de que las variables de entorno estén configuradas en tu plataforma de hosting
- Verifica que el service worker esté siendo servido correctamente
- Verifica que HTTPS esté habilitado (requerido para push notifications)

### La tabla no existe
- Ejecuta la migración SQL en Supabase
- Verifica que tengas permisos para crear tablas
- Si la tabla no existe, el código continuará funcionando pero no guardará suscripciones

## Notas Importantes

- **HTTPS requerido:** Las push notifications solo funcionan en HTTPS (excepto localhost)
- **Service Worker:** El service worker se regenera en cada build. Si modificas `public/sw.js`, los cambios se perderán. Considera usar un plugin de Workbox para mantener el código de push notifications.
- **Suscripciones inválidas:** El código elimina automáticamente suscripciones que ya no son válidas (error 410)
- **Notificaciones en tiempo real vs Push:** 
  - Realtime: Solo funciona cuando la app está abierta
  - Push: Funciona incluso cuando la app está cerrada

