import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkIsAdmin } from '@/lib/supabase/admin';
import { getBooksWithRelations } from '@/lib/supabase/books';
import { sendOrderWhatsAppNotification } from '@/lib/utils/whatsapp-order';
import type { OrderWithDetails, OrderItemWithBook, OrderStatus } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Obtener todos los pedidos (solo admin)
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

    // Verificar que el usuario es admin
    if (!checkIsAdmin(user.email || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');
    const status = searchParams.get('status') as OrderStatus | null;

    if (orderId) {
      // Obtener un pedido específico con sus items
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json({ error: 'Pedido no encontrado' }, { status: 404 });
      }

      // Obtener items del pedido
      const { data: orderItems, error: itemsError } = await admin
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return NextResponse.json({ error: 'Error al obtener los items del pedido' }, { status: 500 });
      }

      // Obtener información completa de los libros
      const allBooks = await getBooksWithRelations();
      const itemsWithBooks: OrderItemWithBook[] = (orderItems || []).map((item) => {
        const book = allBooks.find((b) => b.book_id === item.book_id);
        if (!book) {
          return null;
        }
        return {
          ...item,
          book,
        };
      }).filter((item): item is OrderItemWithBook => item !== null);

      const orderWithDetails: OrderWithDetails = {
        ...order,
        items: itemsWithBooks,
        item_count: itemsWithBooks.length,
        total_items: itemsWithBooks.reduce((sum, item) => sum + item.quantity, 0),
      };

      return NextResponse.json({ order: orderWithDetails }, { status: 200 });
    } else {
      // Obtener todos los pedidos con filtro opcional por status
      let query = admin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: orders, error: ordersError } = await query;

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return NextResponse.json({ error: 'Error al obtener los pedidos' }, { status: 500 });
      }

      // Obtener conteo de items para cada pedido
      const ordersWithDetails: OrderWithDetails[] = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: items } = await admin
            .from('order_items')
            .select('quantity')
            .eq('order_id', order.order_id);

          const itemCount = items?.length || 0;
          const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

          return {
            ...order,
            item_count: itemCount,
            total_items: totalItems,
          };
        })
      );

      return NextResponse.json({ orders: ordersWithDetails }, { status: 200 });
    }
  } catch (error) {
    console.error('API /api/admin/orders GET error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT - Actualizar estado de un pedido (solo admin)
export async function PUT(request: Request) {
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

    // Verificar que el usuario es admin
    if (!checkIsAdmin(user.email || '')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { order_id, status, admin_notes } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'order_id es requerido' }, { status: 400 });
    }

    const updateData: { status?: OrderStatus; admin_notes?: string; completed_at?: string; cancelled_at?: string } = {};
    if (status) {
      const validStatuses: OrderStatus[] = ['pending', 'processing', 'completed', 'cancelled', 'refunded'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Status inválido' }, { status: 400 });
      }
      updateData.status = status;
      
      // Actualizar timestamps según el status
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      } else if (status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString();
      }
    }
    if (admin_notes !== undefined) {
      updateData.admin_notes = admin_notes;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No hay datos para actualizar' }, { status: 400 });
    }

    // Obtener el pedido actual antes de actualizar para verificar si el status cambia a "completed"
    const { data: currentOrder } = await admin
      .from('orders')
      .select('status')
      .eq('order_id', order_id)
      .single();

    const { data: order, error: updateError } = await admin
      .from('orders')
      .update(updateData)
      .eq('order_id', order_id)
      .select()
      .single();

    if (updateError || !order) {
      console.error('Error updating order:', updateError);
      return NextResponse.json({ error: 'Error al actualizar el pedido' }, { status: 500 });
    }

    // Si el status cambió a "completed", enviar notificación de WhatsApp
    if (status === 'completed' && currentOrder?.status !== 'completed') {
      try {
        // Obtener los items del pedido para incluir en el mensaje
        const { data: orderItems, error: itemsError } = await admin
          .from('order_items')
          .select('*')
          .eq('order_id', order_id);

        if (!itemsError && orderItems) {
          // Obtener información completa de los libros
          const allBooks = await getBooksWithRelations();
          const itemsWithBooks: OrderItemWithBook[] = orderItems.map((item) => {
            const book = allBooks.find((b) => b.book_id === item.book_id);
            if (!book) {
              return null;
            }
            return {
              ...item,
              book,
            };
          }).filter((item): item is OrderItemWithBook => item !== null);

          const orderWithDetails: OrderWithDetails = {
            ...order,
            items: itemsWithBooks,
            item_count: itemsWithBooks.length,
            total_items: itemsWithBooks.reduce((sum, item) => sum + item.quantity, 0),
          };

          // Enviar notificación de WhatsApp
          await sendOrderWhatsAppNotification(orderWithDetails);
        }
      } catch (whatsappError) {
        // No fallar la actualización del pedido si falla el envío de WhatsApp
        console.error('Error sending WhatsApp notification:', whatsappError);
      }
    }

    return NextResponse.json({ order }, { status: 200 });
  } catch (error) {
    console.error('API /api/admin/orders PUT error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

