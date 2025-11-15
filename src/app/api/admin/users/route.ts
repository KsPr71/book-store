import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = 'jorgealejandrocasaresdelgado@gmail.com';

/**
 * API Route para obtener todos los usuarios registrados
 * Requiere autenticación y permisos de administrador
 */
export async function GET(request: Request) {
  try {
    // Obtener el token de autorización del header
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    // Crear cliente para verificar autenticación
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    // Si hay token, verificar usuario
    let user = null;
    if (accessToken) {
      const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(accessToken);
      if (!authError && currentUser) {
        user = currentUser;
      }
    }

    // Si no hay usuario autenticado, retornar error
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    // Verificar que el usuario sea administrador
    if (!user.email || user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: 'No tienes permisos de administrador' },
        { status: 403 }
      );
    }

    // Crear cliente con service_role key para tener permisos de admin
    if (!supabaseServiceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta. Contacta al administrador.' },
        { status: 500 }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Obtener todos los usuarios usando el cliente admin
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
      console.error('Error obteniendo usuarios:', error);
      return NextResponse.json(
        { error: error.message || 'Error al obtener usuarios' },
        { status: 500 }
      );
    }

    // Obtener perfiles de usuarios para incluir phone_number
    const { data: profilesData, error: profilesError } = await adminClient
      .from('profiles')
      .select('user_id, phone_number, first_name, last_name');

    // Crear un mapa de user_id -> profile para acceso rápido
    const profilesMap = new Map();
    if (profilesData) {
      profilesData.forEach((profile) => {
        profilesMap.set(profile.user_id, profile);
      });
    }

    // Formatear los datos de usuarios
    const users = data.users.map((user) => {
      const profile = profilesMap.get(user.id);
      return {
        id: user.id,
        email: user.email || 'Sin email',
        createdAt: user.created_at || '',
        emailConfirmed: user.email_confirmed_at !== null,
        lastSignIn: user.last_sign_in_at || null,
        phoneNumber: profile?.phone_number || null,
        firstName: profile?.first_name || null,
        lastName: profile?.last_name || null,
      };
    });

    return NextResponse.json({ users, error: null }, { status: 200 });
  } catch (error) {
    console.error('Error en API /api/admin/users:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { error: errorMessage, users: null },
      { status: 500 }
    );
  }
}

