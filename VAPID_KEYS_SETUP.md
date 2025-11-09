# 🔑 Configuración de Claves VAPID

## 📍 Dónde Colocar las Claves

Las claves VAPID deben agregarse en el archivo **`.env.local`** que está en la **raíz del proyecto** (mismo nivel que `package.json`).

## 📝 Formato del Archivo

Abre el archivo `.env.local` y agrega estas tres líneas al final:

```env
# Claves VAPID para Push Notifications
VAPID_PUBLIC_KEY=tu_clave_publica_aqui
VAPID_PRIVATE_KEY=tu_clave_privada_aqui
NEXT_PUBLIC_VAPID_PUBLIC_KEY=tu_clave_publica_aqui
```

## ⚠️ IMPORTANTE

1. **`VAPID_PUBLIC_KEY`** y **`NEXT_PUBLIC_VAPID_PUBLIC_KEY`** deben tener **EL MISMO VALOR** (ambas son la clave pública)
2. **`VAPID_PRIVATE_KEY`** es la clave privada (nunca la expongas)
3. **NO** pongas comillas alrededor de los valores
4. **NO** dejes espacios antes o después del signo `=`

## ✅ Ejemplo Correcto

```env
VAPID_PUBLIC_KEY=BGxK5q3Y2Z8vN1mP4rT7wJ0cL6hF9dS2aB5eG8iK1nM4pQ7sU0vW3xY6zA9
VAPID_PRIVATE_KEY=8K2mN5pQ7sT0vW3xY6zA9bC2dE5fG8hI1jK4lM7nO0pQ3rS6tU9vW2xY5
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BGxK5q3Y2Z8vN1mP4rT7wJ0cL6hF9dS2aB5eG8iK1nM4pQ7sU0vW3xY6zA9
```

## 🔄 Después de Agregar las Claves

1. **Guarda el archivo** `.env.local`
2. **Detén el servidor** (Ctrl+C en la terminal donde corre `npm run dev`)
3. **Reinicia el servidor** con `npm run dev`
4. **Recarga la página** en el navegador

## 🧪 Verificar que Funciona

1. Abre la consola del navegador (F12)
2. Ve a la sección de Configuración de la app
3. Intenta activar las notificaciones
4. Si ves el error "VAPID keys not configured", verifica:
   - Que las variables estén exactamente como se muestra arriba
   - Que hayas reiniciado el servidor
   - Que no haya espacios extra o comillas

## 📂 Ubicación del Archivo

```
book-store/
├── .env.local          ← AQUÍ van las claves
├── package.json
├── next.config.ts
└── ...
```

## 🚨 Si Sigue Sin Funcionar

1. Verifica que el archivo se llame exactamente `.env.local` (con el punto al inicio)
2. Verifica que esté en la raíz del proyecto (no en una subcarpeta)
3. Verifica que no haya errores de sintaxis (líneas vacías están bien)
4. Reinicia completamente el servidor (cierra y vuelve a abrir la terminal)

