import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { CheckoutData } from '@/types/database';
import { sendAdminNotification } from '@/lib/utils/admin-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// POST - Procesar checkout
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
    const checkoutData: CheckoutData = body.checkoutData;

    // Validar datos de checkout
    if (!checkoutData.customer_name || !checkoutData.customer_email) {
      return NextResponse.json({ error: 'Nombre y email son requeridos' }, { status: 400 });
    }

    // Obtener items del carrito
    const { data: cartItems, error: cartError } = await admin
      .from('cart')
      .select('*')
      .eq('user_id', user.id);

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      return NextResponse.json({ error: 'Error al obtener el carrito' }, { status: 500 });
    }

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json({ error: 'El carrito está vacío' }, { status: 400 });
    }

    // Obtener información de los libros y calcular total
    let totalAmount = 0;
    const orderItems = [];

    for (const cartItem of cartItems) {
      const { data: book, error: bookError } = await admin
        .from('books')
        .select('*')
        .eq('book_id', cartItem.book_id)
        .single();

      if (bookError || !book) {
        return NextResponse.json({ error: `Libro ${cartItem.book_id} no encontrado` }, { status: 404 });
      }

      if (book.status !== 'available') {
        return NextResponse.json({ error: `El libro "${book.title}" no está disponible` }, { status: 400 });
      }

      const unitPrice = book.price;
      const subtotal = unitPrice * cartItem.quantity;
      totalAmount += subtotal;

      orderItems.push({
        book_id: book.book_id,
        quantity: cartItem.quantity,
        unit_price: unitPrice,
        subtotal,
      });
    }

    // Crear el pedido
    const { data: order, error: orderError } = await admin
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        total_amount: totalAmount,
        customer_name: checkoutData.customer_name,
        customer_email: checkoutData.customer_email,
        customer_phone: checkoutData.customer_phone || null,
        shipping_address: checkoutData.shipping_address || null,
        notes: checkoutData.notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error('Error creating order:', orderError);
      return NextResponse.json({ error: 'Error al crear el pedido' }, { status: 500 });
    }

    // Crear los items del pedido
    const orderItemsToInsert = orderItems.map((item) => ({
      order_id: order.order_id,
      book_id: item.book_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.subtotal,
    }));

    const { error: itemsError } = await admin
      .from('order_items')
      .insert(orderItemsToInsert);

    if (itemsError) {
      console.error('Error creating order items:', itemsError);
      // Intentar eliminar el pedido creado
      await admin.from('orders').delete().eq('order_id', order.order_id);
      return NextResponse.json({ error: 'Error al crear los items del pedido' }, { status: 500 });
    }

    // Limpiar el carrito
    const { error: clearCartError } = await admin
      .from('cart')
      .delete()
      .eq('user_id', user.id);

    if (clearCartError) {
      console.error('Error clearing cart:', clearCartError);
      // No fallar el checkout si el carrito no se limpia, solo loguear
    }

    // Enviar notificación al admin sobre el nuevo pedido
    try {
      console.log(`📢 Attempting to send admin notification for order ${order.order_number}`);
      const notifResult = await sendAdminNotification(
        '🛒 Nuevo pedido recibido',
        `Pedido ${order.order_number} por ${checkoutData.customer_name} - Total: $${totalAmount.toFixed(2)}`,
        {
          url: `/admin?tab=orders`,
          orderId: order.order_id,
          orderNumber: order.order_number,
        }
      );
      
      if (notifResult.success && notifResult.sent > 0) {
        console.log(`✅ Admin notification sent successfully for order ${order.order_number}`);
      } else {
        console.warn(`⚠️ Admin notification failed or no subscriptions: ${notifResult.error || 'No subscriptions found'}`);
      }
    } catch (notifError) {
      console.error('❌ Error sending admin notification:', notifError);
      // No fallar el checkout si falla la notificación
    }

    return NextResponse.json({
      success: true,
      order: {
        order_id: order.order_id,
        order_number: order.order_number,
        total_amount: order.total_amount,
      },
    }, { status: 200 });
  } catch (error) {
    console.error('API /api/checkout POST error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

