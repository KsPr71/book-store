import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { first_name, last_name, birth_date, genres } = body;

    // Basic validation
    if (!first_name && !last_name && !birth_date && (!genres || genres.length === 0)) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Limit genres to max 5 and ensure they are strings (category_id uuids)
    const cleanedGenres = Array.isArray(genres)
      ? (genres.filter((g) => typeof g === 'string') as string[]).slice(0, 5)
      : [];

    // If genres provided, validate they exist in categories table
    if (cleanedGenres.length > 0) {
      const { data: foundCategories, error: catError } = await admin
        .from('categories')
        .select('category_id')
        .in('category_id', cleanedGenres);

      if (catError) {
        console.error('Error querying categories for validation:', catError);
        return NextResponse.json({ error: 'Error validando géneros' }, { status: 500 });
      }

  const foundIds = (foundCategories || []).map((c: { category_id: string }) => c.category_id);
      const invalid = cleanedGenres.filter((id) => !foundIds.includes(id));
      if (invalid.length > 0) {
        return NextResponse.json({ error: 'Algunos géneros no son válidos', invalid }, { status: 400 });
      }
    }

    const payload = {
      user_id: user.id,
      first_name: first_name || null,
      last_name: last_name || null,
      birth_date: birth_date || null,
      genres: cleanedGenres,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await admin
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      console.error('Error upserting profile:', error);
      return NextResponse.json({ error: error.message || 'Error guardando perfil' }, { status: 500 });
    }

    // Try to sync first_name / last_name into the auth user's metadata (best-effort)
    try {
      const meta: Record<string, unknown> = {};
      if (first_name) meta.first_name = first_name;
      if (last_name) meta.last_name = last_name;

      if (Object.keys(meta).length > 0) {
        // Use admin auth admin API to update user metadata
        // Note: this requires service role key (we have admin client)
        // updateUserById expects AdminUserAttributes shape
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - admin typings may differ depending on supabase client version
        const { error: userUpdateError } = await admin.auth.admin.updateUserById(user.id, {
          user_metadata: meta,
        });
        if (userUpdateError) {
          console.warn('No se pudo sincronizar user_metadata:', userUpdateError);
        }
      }
    } catch (e) {
      console.warn('Error sincronizando user metadata (no crítico):', e);
    }

    return NextResponse.json({ profile: data, error: null }, { status: 200 });
  } catch (error) {
    console.error('API /api/profile error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await client.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // no data
        return NextResponse.json({ profile: null, error: null }, { status: 200 });
      }
      return NextResponse.json({ error: error.message || 'Error obteniendo perfil' }, { status: 500 });
    }

    return NextResponse.json({ profile: data, error: null }, { status: 200 });
  } catch (error) {
    console.error('API /api/profile GET error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
