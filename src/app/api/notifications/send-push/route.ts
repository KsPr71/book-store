import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { supabase } from '@/lib/supabase/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { book } = body;

    console.log('📚 Recibida solicitud para enviar push notifications para libro:', book?.title);

    if (!book) {
      console.error('❌ Missing book data');
      return NextResponse.json({ ok: false, error: 'Missing book data' }, { status: 400 });
    }

    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.error('VAPID keys not set');
      return NextResponse.json({ ok: false, error: 'VAPID keys not configured on server' }, { status: 500 });
    }

    // Configurar web-push con las claves VAPID
    const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL || `mailto:admin@${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : 'example.com'}`;
    webpush.setVapidDetails(contact, publicKey, privateKey);

    // Obtener todas las suscripciones activas
    // Filtrar para evitar duplicados: priorizar móviles sobre desktop
    // Si hay múltiples suscripciones del mismo usuario, enviar solo a móvil
    const { data: allSubscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('endpoint, keys, device_type, user_agent')
      .order('device_type', { ascending: true }); // mobile primero, luego desktop

    if (fetchError) {
      console.error('Error fetching subscriptions:', fetchError);
      // Si la tabla no existe, retornar éxito pero sin enviar
      if (fetchError.code === '42P01') {
        console.warn('Table push_subscriptions does not exist. No push notifications sent.');
        return NextResponse.json({ ok: true, warning: 'Table does not exist', sent: 0 });
      }
      return NextResponse.json({ ok: false, error: 'Error fetching subscriptions' }, { status: 500 });
    }

    // Filtrar suscripciones para evitar duplicados
    // Si hay múltiples suscripciones del mismo usuario (mismo user_agent), priorizar móvil
    const subscriptionsMap = new Map<string, typeof allSubscriptions[0]>();
    
    if (allSubscriptions) {
      for (const sub of allSubscriptions) {
        // Usar user_agent como clave para identificar usuarios duplicados
        const userKey = sub.user_agent || sub.endpoint;
        
        // Si ya existe una suscripción para este usuario
        if (subscriptionsMap.has(userKey)) {
          const existing = subscriptionsMap.get(userKey)!;
          // Priorizar móvil sobre desktop
          if (sub.device_type === 'mobile' && existing.device_type === 'desktop') {
            subscriptionsMap.set(userKey, sub);
          }
          // Si ambas son del mismo tipo, mantener la más reciente (ya están ordenadas)
        } else {
          subscriptionsMap.set(userKey, sub);
        }
      }
    }

    const subscriptions = Array.from(subscriptionsMap.values());

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️ No push subscriptions found in database');
      return NextResponse.json({ ok: true, sent: 0, message: 'No hay suscripciones en la base de datos' });
    }

    console.log(`📋 Encontradas ${subscriptions.length} suscripción(es) en la base de datos`);
    console.log('📚 Datos del libro:', { book_id: book.book_id, title: book.title });

    // Obtener la URL base de producción
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    'https://book-store-weld-one.vercel.app';
    
    // Preparar el payload de la notificación (mismo formato que send-test)
    // Usar book_id como tag para que cada notificación sea única
    const payload = {
      title: '📚 Nuevo libro disponible',
      body: `${book.title} ha sido agregado al catálogo`,
      icon: book.cover_image_url || `${baseUrl}/icons/icon-192x192.png`,
      badge: `${baseUrl}/icons/icon-192x192.png`,
      tag: `book-${book.book_id}`, // Tag único por libro para que no se agrupen
      data: {
        url: `${baseUrl}/book/${book.book_id}`, // URL absoluta para evitar localhost
        bookId: book.book_id,
      },
    };
    
    console.log('📤 Enviando payload:', payload);

    // Enviar notificaciones a todas las suscripciones
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const subscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.keys.p256dh,
            auth: sub.keys.auth,
          },
        };

        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return { success: true, endpoint: sub.endpoint };
      } catch (err) {
        const error = err as { statusCode?: number; message?: string };
        console.error(`Error sending push to ${sub.endpoint}:`, error);
        
        // Si la suscripción es inválida (410 Gone), eliminarla
        if (error.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }
        
        return { success: false, endpoint: sub.endpoint, error: error.message || String(error) };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ Push notifications sent: ${successful} successful, ${failed} failed`);

    return NextResponse.json({
      ok: true,
      sent: successful,
      failed,
      total: subscriptions.length,
    });
  } catch (err) {
    console.error('Error sending push notifications', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

