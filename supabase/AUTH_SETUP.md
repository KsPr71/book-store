# Configuración de Autenticación con Supabase

Este documento explica cómo configurar la autenticación de Supabase para el sistema de login.

## 🔐 Configuración en Supabase Dashboard

### 1. Habilitar Proveedores de Autenticación

1. Ve a tu proyecto en Supabase: https://app.supabase.com
2. Navega a **Authentication** → **Providers**
3. Habilita los proveedores que deseas usar:

#### Email/Password
- Ya está habilitado por defecto
- Configuración de email templates (opcional)

#### Google OAuth
1. Activa el toggle de **Google**
2. Necesitarás crear credenciales en Google Cloud Console:
   - Ve a: https://console.cloud.google.com/apis/credentials
   - Crea un nuevo proyecto o selecciona uno existente
   - Crea credenciales OAuth 2.0 (Web application)
   - Agrega como URI autorizado: `https://[TU_PROJECT_REF].supabase.co/auth/v1/callback`
   - Copia el **Client ID** y **Client Secret**
   - Pégalos en la configuración de Google en Supabase

#### GitHub OAuth
1. Activa el toggle de **GitHub**
2. Necesitarás crear una OAuth App en GitHub:
   - Ve a: https://github.com/settings/developers
   - Click en **New OAuth App**
   - **Application name**: Tu app name
   - **Homepage URL**: `http://localhost:3000` (desarrollo) o tu dominio de producción
   - **Authorization callback URL**: `https://[TU_PROJECT_REF].supabase.co/auth/v1/callback`
   - Copia el **Client ID** y crea un **Client Secret**
   - Pégalos en la configuración de GitHub en Supabase

### 2. Configurar Redirect URLs

1. Ve a **Authentication** → **URL Configuration**
2. Agrega tus URLs en **Redirect URLs**:
   - Desarrollo: `http://localhost:3000/auth/callback`
   - Producción: `https://tu-dominio.com/auth/callback`

### 3. Configurar Email Templates (Opcional)

1. Ve a **Authentication** → **Email Templates**
2. Personaliza los templates de:
   - Confirm signup
   - Magic Link
   - Change Email Address
   - Reset Password

## 🚀 Funcionalidades Implementadas

### Autenticación por Email/Password
- ✅ Registro de nuevos usuarios
- ✅ Login con email y contraseña
- ✅ Verificación de email (configurable en Supabase)

### Autenticación OAuth
- ✅ Login con Google
- ✅ Login con GitHub

### Gestión de Sesión
- ✅ Contexto de autenticación global (`AuthContext`)
- ✅ Manejo automático de sesiones
- ✅ Logout

## 📁 Archivos Creados

1. **`src/lib/supabase/auth.ts`**: Funciones de autenticación
   - `signUp()`: Registro de usuarios
   - `signIn()`: Login con email/password
   - `signInWithProvider()`: Login OAuth
   - `signOut()`: Cerrar sesión
   - `getSession()`: Obtener sesión actual
   - `resetPassword()`: Resetear contraseña

2. **`src/contexts/AuthContext.tsx`**: Contexto de autenticación
   - Maneja el estado global de autenticación
   - Provee hooks: `useAuth()`

3. **`src/components/auth-form.tsx`**: Componente de formulario
   - Soporta modo login y signup
   - Maneja errores y estados de carga
   - Integración con OAuth

4. **`src/app/login/page.tsx`**: Página de login
5. **`src/app/signup/page.tsx`**: Página de registro
6. **`src/app/auth/callback/route.ts`**: Callback para OAuth

## 💻 Uso en el Código

### Usar el hook de autenticación

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signUp, logout } = useAuth();

  if (loading) return <div>Cargando...</div>;
  
  if (user) {
    return <div>Bienvenido, {user.email}</div>;
  }

  return <div>No has iniciado sesión</div>;
}
```

### Proteger rutas (ejemplo)

```typescript
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return <div>Cargando...</div>;
  if (!user) return null;

  return <div>Contenido protegido</div>;
}
```

## ⚠️ Importante

1. **Verificación de Email**: Por defecto, Supabase requiere verificación de email. Puedes desactivarla en **Authentication** → **Settings** → **Enable email confirmations**

2. **Row Level Security (RLS)**: Si quieres proteger datos basados en el usuario, configura RLS policies en tus tablas de Supabase

3. **Variables de Entorno**: Asegúrate de tener configuradas:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔒 Seguridad

- Las contraseñas se hashean automáticamente por Supabase
- Las sesiones se almacenan de forma segura
- OAuth maneja tokens de forma segura
- Nunca expongas la `service_role` key en el cliente

