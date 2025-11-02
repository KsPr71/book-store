import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/';
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // Manejar diferentes tipos de callbacks
    if (type === 'recovery') {
      // Callback para reset de contraseña
      await supabase.auth.exchangeCodeForSession(code);
    } else {
      // Callback normal (OAuth, email confirmation, etc.)
      await supabase.auth.exchangeCodeForSession(code);
    }
  }

  return NextResponse.redirect(new URL(next, requestUrl.origin));
}

