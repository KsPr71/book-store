# Guía para Abrir DevTools en Móvil

## Método 1: Chrome Remote Debugging (Recomendado - Android)

### Requisitos
- Chrome en tu computadora
- Cable USB
- Teléfono Android con Chrome

### Pasos

#### En el Teléfono Android:

1. **Activar Opciones de Desarrollador**:
   - Ir a: `Configuración` → `Acerca del teléfono`
   - Buscar "Número de compilación" o "Build number"
   - Tocar 7 veces seguidas hasta que aparezca "Ahora eres desarrollador"

2. **Activar Depuración USB**:
   - Ir a: `Configuración` → `Opciones de desarrollador` (o `Developer options`)
   - Activar "Depuración USB" (USB debugging)
   - Aceptar la advertencia de seguridad

3. **Conectar el teléfono a la PC**:
   - Conectar con cable USB
   - En el teléfono, cuando aparezca el diálogo, seleccionar "Permitir depuración USB"
   - Marcar "Siempre permitir desde este equipo" (opcional)

#### En la Computadora:

4. **Abrir Chrome DevTools**:
   - Abrir Chrome en la PC
   - Ir a: `chrome://inspect` (escribir en la barra de direcciones)
   - Deberías ver tu teléfono listado
   - Hacer clic en "inspeccionar" debajo del dispositivo

5. **Navegar al sitio**:
   - Abrir el sitio en Chrome del teléfono
   - La pestaña aparecerá automáticamente en DevTools de la PC
   - Ahora puedes ver la consola, Application, Network, etc.

## Método 2: Chrome DevTools Remoto (Sin USB - Android)

### Requisitos
- Chrome en tu computadora
- Teléfono Android con Chrome
- Ambos en la misma red WiFi

### Pasos

1. **En el teléfono**:
   - Abrir Chrome
   - Ir a: `chrome://inspect` (escribir en la barra de direcciones)
   - Activar "Descubrir dispositivos de red" (Discover network devices)

2. **En la computadora**:
   - Abrir Chrome
   - Ir a: `chrome://inspect`
   - Deberías ver el teléfono en la lista
   - Hacer clic en "inspeccionar"

**Nota**: Este método puede ser menos estable que USB.

## Método 3: Safari Web Inspector (iOS)

### Requisitos
- Mac con Safari
- iPhone/iPad con iOS
- Cable USB

### Pasos

#### En el iPhone/iPad:

1. **Activar Web Inspector**:
   - Ir a: `Configuración` → `Safari` → `Avanzado`
   - Activar "Web Inspector"

#### En la Mac:

2. **Conectar el dispositivo**:
   - Conectar iPhone/iPad a la Mac con cable USB
   - Confiar en la computadora si aparece el diálogo

3. **Abrir Safari en la Mac**:
   - Abrir Safari
   - Ir al menú: `Safari` → `Preferencias` → `Avanzado`
   - Activar "Mostrar menú Desarrollo en la barra de menús"

4. **Abrir Web Inspector**:
   - En el iPhone, abrir el sitio en Safari
   - En la Mac, ir a: `Desarrollo` → `[Tu iPhone]` → `[Nombre del sitio]`
   - Se abrirá Web Inspector

## Método 4: Consola Móvil Directa (Sin PC)

### Opción A: Usar Eruda (Consola flotante)

Agrega esto temporalmente a tu código para tener una consola en el móvil:

```html
<script src="https://cdn.jsdelivr.net/npm/eruda"></script>
<script>eruda.init();</script>
```

O en Next.js, agrega en `src/app/layout.tsx`:

```tsx
{process.env.NODE_ENV === 'development' && (
  <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
  <script dangerouslySetInnerHTML={{__html: 'eruda.init();'}} />
)}
```

### Opción B: Usar vConsole

```html
<script src="https://unpkg.com/vconsole@latest/dist/vconsole.min.js"></script>
<script>new VConsole();</script>
```

## Método 5: Chrome para Android - Menú de Desarrollador

### Pasos:

1. Abrir Chrome en Android
2. Ir a: `chrome://flags`
3. Buscar "Developer tools"
4. Activar las herramientas de desarrollador
5. Reiniciar Chrome
6. Abrir el menú (⋮) → `Más herramientas` → `Herramientas para desarrolladores`

**Nota**: Esta opción es limitada comparada con Remote Debugging.

## Verificar Service Worker en Móvil

Una vez que tengas DevTools abierto:

1. **Ir a la pestaña "Application"** (o "Aplicación")
2. **En el menú lateral, buscar "Service Workers"**
3. **Verificar que esté "activated and is running"**
4. **Si hay errores, aparecerán en rojo**

## Verificar Manifest en Móvil

1. **En DevTools, ir a "Application"**
2. **En el menú lateral, buscar "Manifest"**
3. **Verificar que todos los iconos carguen correctamente**
4. **Verificar que no haya errores de validación**

## Ver Consola en Móvil

1. **En DevTools, ir a la pestaña "Console"**
2. **Ver todos los logs de la aplicación**
3. **Filtrar por nivel (Error, Warning, Info)**

## Comandos Útiles en la Consola

```javascript
// Verificar si está instalada
window.matchMedia("(display-mode: standalone)").matches

// Verificar service worker
navigator.serviceWorker.ready.then(reg => console.log(reg))

// Verificar manifest
fetch('/manifest.json').then(r => r.json()).then(console.log)

// Ver todos los service workers registrados
navigator.serviceWorker.getRegistrations().then(regs => console.log(regs))

// Desregistrar todos los service workers
navigator.serviceWorker.getRegistrations().then(regs => 
  regs.forEach(reg => reg.unregister())
)
```

## Solución de Problemas

### No aparece el dispositivo en chrome://inspect
- Verificar que la depuración USB esté activada
- Desconectar y reconectar el cable USB
- Reiniciar Chrome en la PC
- Verificar que el cable USB soporte transferencia de datos (no solo carga)

### No se puede inspeccionar
- Verificar que Chrome esté actualizado en ambos dispositivos
- Cerrar y reabrir Chrome en el teléfono
- Desactivar y reactivar la depuración USB

### Errores de conexión
- Verificar que ambos dispositivos estén en la misma red (si usas WiFi)
- Verificar que el firewall no esté bloqueando la conexión
- Probar con otro cable USB

## Alternativa Rápida: Screenshots y Logs

Si no puedes usar DevTools, puedes:

1. **Tomar screenshots** de los errores
2. **Usar `console.log()`** y ver los logs en la consola remota
3. **Agregar Eruda temporalmente** para ver la consola en el móvil

## Recomendación

**Para desarrollo de PWA, el Método 1 (Chrome Remote Debugging con USB) es el más confiable** porque:
- Conexión estable
- Acceso completo a todas las herramientas
- Mejor rendimiento
- Puedes ver la consola en tiempo real

