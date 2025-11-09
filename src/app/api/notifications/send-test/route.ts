import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const subscription = body?.subscription;
    const payload = body?.payload || { title: 'Prueba', body: 'Notificación de prueba desde el servidor', data: {} };

    if (!subscription) {
      return NextResponse.json({ ok: false, error: 'Missing subscription in request body' }, { status: 400 });
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

    // Log de diagnóstico: mostrar endpoint y claves parciales
    try {
      const subLike = subscription as unknown as { endpoint?: string };
      console.log('send-test: subscription endpoint:', subLike.endpoint || 'no-endpoint');
    } catch {
      console.log('send-test: could not read subscription.endpoint');
    }

    // Enviar la notificación
    const sendResult = await webpush.sendNotification(subscription, typeof payload === 'string' ? payload : JSON.stringify(payload));
    console.log('send-test: web-push send completed', { sendResult });

    return NextResponse.json({ ok: true, result: !!sendResult });
  } catch (err) {
    console.error('Error sending test push', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
