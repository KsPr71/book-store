import { NextRequest, NextResponse } from 'next/server';
import { sendAdminNotification } from '@/lib/utils/admin-notifications';

/**
 * Endpoint para notificar al admin cuando se registra un nuevo usuario
 * Se llama desde el cliente después de un registro exitoso
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, firstName, lastName } = body;

    if (!email) {
      return NextResponse.json(
        { ok: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Enviar notificación al admin
    const userName = firstName || lastName
      ? `${firstName || ''} ${lastName || ''}`.trim()
      : email.split('@')[0];

    console.log(`📢 Attempting to send admin notification for new user: ${email}`);
    
    const notifResult = await sendAdminNotification(
      '👤 Nuevo usuario registrado',
      `${userName} (${email}) se ha registrado en la plataforma`,
      {
        url: '/admin?tab=users',
        email,
      }
    );

    if (notifResult.success && notifResult.sent > 0) {
      console.log(`✅ Admin notification sent successfully for new user: ${email}`);
    } else {
      console.warn(`⚠️ Admin notification failed or no subscriptions: ${notifResult.error || 'No subscriptions found'}`);
    }

    return NextResponse.json({ ok: true, notificationSent: notifResult.sent > 0 });
  } catch (err) {
    console.error('Error sending new user notification:', err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

