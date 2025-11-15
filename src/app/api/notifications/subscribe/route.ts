import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subscription = body.subscription;
    const userAgent = req.headers.get('user-agent') || '';
    const origin = req.headers.get('origin') || '';
    const authHeader = req.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ ok: false, error: 'Invalid subscription' }, { status: 400 });
    }

    // Obtener usuario si está autenticado
    let userId: string | null = null;
    if (accessToken) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      });
      const { data: { user } } = await supabase.auth.getUser(accessToken);
      userId = user?.id || null;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false },
    });

    // Detectar tipo de dispositivo
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const deviceType = isMobile ? 'mobile' : 'desktop';
    
    // Extraer información del endpoint para identificar el dispositivo
    const endpointInfo = subscription.endpoint.includes('fcm.googleapis.com') ? 'android' : 
                        subscription.endpoint.includes('wns') ? 'windows' : 
                        subscription.endpoint.includes('updates.push.services.mozilla.com') ? 'firefox' : 
                        'chrome';

    // Guardar la suscripción en Supabase
    // Primero verificar si ya existe
    const { data: existing } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      user_id: userId,
      device_type: deviceType,
      user_agent: userAgent.substring(0, 200), // Limitar longitud
      origin: origin,
      endpoint_type: endpointInfo,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      // Actualizar la suscripción existente
      const { error } = await supabase
        .from('push_subscriptions')
        .update(subscriptionData)
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
          ...subscriptionData,
          created_at: new Date().toISOString(),
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

    console.log(`✅ Push subscription saved: ${subscription.endpoint} (${deviceType})`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error receiving subscription', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
