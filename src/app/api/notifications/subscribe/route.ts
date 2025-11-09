import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subscription = body.subscription;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ ok: false, error: 'Invalid subscription' }, { status: 400 });
    }

    // Guardar la suscripción en Supabase
    // Primero verificar si ya existe
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existing) {
      // Actualizar la suscripción existente
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          keys: subscription.keys,
          updated_at: new Date().toISOString(),
        })
        .eq('endpoint', subscription.endpoint);

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json({ ok: false, error: 'Error updating subscription' }, { status: 500 });
      }
    } else {
      // Crear nueva suscripción
      const { error } = await supabase
        .from('push_subscriptions')
        .insert({
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        });

      if (error) {
        console.error('Error saving subscription:', error);
        // Si la tabla no existe, solo loguear y continuar (para desarrollo)
        if (error.code === '42P01') {
          console.warn('Table push_subscriptions does not exist. Skipping database save.');
          return NextResponse.json({ ok: true, warning: 'Table does not exist' });
        }
        return NextResponse.json({ ok: false, error: 'Error saving subscription' }, { status: 500 });
      }
    }

    console.log('✅ Push subscription saved:', subscription.endpoint);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error receiving subscription', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
