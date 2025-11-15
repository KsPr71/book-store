import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBooksWithRelations } from '@/lib/supabase/books';
import type { OrderWithDetails, OrderItemWithBook } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Obtener pedidos del usuario
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

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order_id');

    if (orderId) {
      // Obtener un pedido específico con sus items
      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*')
        .eq('order_id', orderId)
        .eq('user_id', user.id)
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
      // Obtener todos los pedidos del usuario
      const { data: orders, error: ordersError } = await admin
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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
    console.error('API /api/orders GET error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

