import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const endpoint = body.endpoint;

    if (!endpoint) {
      return NextResponse.json({ ok: false, error: 'Missing endpoint' }, { status: 400 });
    }

    // Eliminar la suscripción de Supabase
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error deleting subscription:', error);
      // Si la tabla no existe, solo loguear y continuar
      if (error.code === '42P01') {
        console.warn('Table push_subscriptions does not exist. Skipping database delete.');
        return NextResponse.json({ ok: true, warning: 'Table does not exist' });
      }
      return NextResponse.json({ ok: false, error: 'Error deleting subscription' }, { status: 500 });
    }

    console.log('✅ Push subscription deleted:', endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in unsubscribe', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
