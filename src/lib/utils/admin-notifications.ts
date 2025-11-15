import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL = 'jorgealejandrocasaresdelgado@gmail.com';

/**
 * Obtiene las suscripciones push del admin
 */
async function getAdminSubscriptions() {
  if (!supabaseServiceRoleKey) {
    console.error('❌ Service role key not configured');
    return [];
  }

  const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Obtener el user_id del admin
  const { data: adminUsers, error: usersError } = await adminClient.auth.admin.listUsers();

  if (usersError || !adminUsers) {
    console.error('❌ Error fetching admin users:', usersError);
    return [];
  }

  const adminUser = adminUsers.users.find(
    (u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()
  );

  if (!adminUser) {
    console.warn(`⚠️ Admin user not found with email: ${ADMIN_EMAIL}`);
    console.warn(`📋 Available users: ${adminUsers.users.map(u => u.email).join(', ')}`);
    return [];
  }

  console.log(`✅ Admin user found: ${adminUser.email} (${adminUser.id})`);

  // Obtener suscripciones del admin
  const { data: subscriptions, error } = await adminClient
    .from('push_subscriptions')
    .select('endpoint, keys, user_id')
    .eq('user_id', adminUser.id);

  if (error) {
    console.error('❌ Error fetching admin subscriptions:', error);
    return [];
  }

  if (!subscriptions || subscriptions.length === 0) {
    console.warn(`⚠️ No push subscriptions found for admin user ${adminUser.id}`);
    console.warn('💡 The admin needs to subscribe to push notifications from their browser');
  } else {
    console.log(`✅ Found ${subscriptions.length} subscription(s) for admin`);
  }

  return subscriptions || [];
}

/**
 * Envía una notificación push al admin
 */
export async function sendAdminNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<{ success: boolean; sent: number; error?: string }> {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      console.error('VAPID keys not set');
      return { success: false, sent: 0, error: 'VAPID keys not configured' };
    }

    // Configurar web-push
    const contact =
      process.env.NEXT_PUBLIC_CONTACT_EMAIL ||
      `mailto:admin@${process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : 'example.com'}`;
    webpush.setVapidDetails(contact, publicKey, privateKey);

    // Obtener suscripciones del admin
    const subscriptions = await getAdminSubscriptions();

    if (subscriptions.length === 0) {
      console.warn('⚠️ No admin push subscriptions found');
      console.warn('💡 El admin debe suscribirse a notificaciones push desde su navegador');
      return { success: true, sent: 0, error: 'No admin subscriptions found' };
    }

    console.log(`📱 Found ${subscriptions.length} admin subscription(s)`);

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://book-store-weld-one.vercel.app';

    const payload = {
      title,
      body,
      icon: `${baseUrl}/icons/icon-192x192.png`,
      badge: `${baseUrl}/icons/icon-192x192.png`,
      tag: `admin-${Date.now()}`,
      data: data || {},
    };

    // Enviar notificaciones
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
        console.error(`Error sending push to admin ${sub.endpoint}:`, error);

        // Si la suscripción es inválida, eliminarla
        if (error.statusCode === 410) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false },
          });
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint);
        }

        return { success: false, endpoint: sub.endpoint, error: error.message || String(error) };
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const successful = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failed = results.filter(
      (r) => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
    );

    if (successful > 0) {
      console.log(`✅ Admin notification sent: ${successful} successful`);
    } else {
      console.error(`❌ Admin notification failed: ${failed.length} failed`);
      failed.forEach((result, index) => {
        if (result.status === 'rejected') {
          console.error(`  - Subscription ${index}: ${result.reason}`);
        } else if (result.status === 'fulfilled' && !result.value.success) {
          console.error(`  - Subscription ${index}: ${result.value.error || 'Unknown error'}`);
        }
      });
    }

    return { 
      success: successful > 0, 
      sent: successful,
      error: successful === 0 ? 'All notifications failed' : undefined
    };
  } catch (err) {
    console.error('Error sending admin notification:', err);
    return {
      success: false,
      sent: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

