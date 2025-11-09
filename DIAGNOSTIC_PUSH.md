# 🔍 Diagnóstico de Push Notifications

## Pasos para Diagnosticar

### 1. Verificar que la tabla existe en Supabase

Ejecuta esta consulta en el SQL Editor de Supabase:

```sql
SELECT * FROM push_subscriptions;
```

Si la tabla no existe, ejecuta la migración:
```sql
-- Ejecutar: supabase/migrations/002_push_subscriptions.sql
```

### 2. Verificar que hay suscripciones guardadas

En el SQL Editor de Supabase:
```sql
SELECT COUNT(*) as total_suscripciones FROM push_subscriptions;
```

Si el resultado es 0, significa que no hay usuarios suscritos.

### 3. Verificar que te suscribiste correctamente

1. Abre la app en el navegador
2. Ve a Configuración
3. Activa las notificaciones
4. En el componente de debug, haz clic en "Suscribir Push"
5. Verifica en la consola que aparezca "✅ Suscrito a push notifications"
6. Verifica en Supabase que aparezca una fila en `push_subscriptions`

### 4. Verificar los logs al crear un libro

**En la consola del navegador (F12):**
- Deberías ver: "📤 Enviando push notifications para libro: [título]"
- Deberías ver: "📬 Respuesta del servidor: {ok: true, sent: X}"

**En la terminal del servidor:**
- Deberías ver: "📚 Recibida solicitud para enviar push notifications..."
- Si no hay suscripciones: "⚠️ No push subscriptions found in database"
- Si hay suscripciones: "📋 Encontradas X suscripción(es)..."

### 5. Verificar el estado del libro

El libro debe crearse con estado **"Disponible" (available)** para que se envíen notificaciones.

## Problemas Comunes

### ❌ "No push subscriptions found in database"
**Solución:** 
- Asegúrate de hacer clic en "Suscribir Push" después de activar las notificaciones
- Verifica que la tabla `push_subscriptions` exista en Supabase
- Verifica que la suscripción se guardó correctamente

### ❌ "Table push_subscriptions does not exist"
**Solución:**
- Ejecuta la migración SQL: `supabase/migrations/002_push_subscriptions.sql`
- O crea la tabla manualmente en Supabase

### ❌ El libro se crea pero no se envían notificaciones
**Verifica:**
- Que el libro tenga estado "available"
- Que haya al menos una suscripción en la base de datos
- Los logs en la consola del navegador y del servidor

### ❌ Las notificaciones de prueba funcionan pero las de libros no
**Verifica:**
- Que el libro se esté creando con estado "available"
- Los logs en la consola para ver si se está llamando al endpoint
- Que no haya errores en la consola del servidor

