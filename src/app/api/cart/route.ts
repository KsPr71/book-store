import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBooksWithRelations } from '@/lib/supabase/books';
import type { CartItemWithBook } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// GET - Obtener carrito del usuario
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

    // Usar service role key para operaciones del carrito (bypass RLS ya que validamos el usuario)
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Obtener items del carrito
    const { data: cartItems, error: cartError } = await admin
      .from('cart')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (cartError) {
      console.error('Error fetching cart:', cartError);
      // Si el error es que la tabla no existe, dar un mensaje más claro
      if (cartError.code === '42P01' || cartError.message?.includes('does not exist')) {
        return NextResponse.json({ 
          error: 'La tabla cart no existe. Por favor, aplica la migración 003_orders_system.sql en Supabase.',
          details: cartError.message,
          code: cartError.code
        }, { status: 500 });
      }
      return NextResponse.json({ 
        error: 'Error al obtener el carrito',
        details: cartError.message,
        code: cartError.code
      }, { status: 500 });
    }

    // Obtener información completa de los libros
    const allBooks = await getBooksWithRelations();
    const itemsWithBooks: CartItemWithBook[] = (cartItems || []).map((item) => {
      const book = allBooks.find((b) => b.book_id === item.book_id);
      if (!book) {
        return null;
      }
      return {
        ...item,
        book,
      };
    }).filter((item): item is CartItemWithBook => item !== null);

    return NextResponse.json({ items: itemsWithBooks }, { status: 200 });
  } catch (error) {
    console.error('API /api/cart GET error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST - Agregar item al carrito
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

    // Usar service role key para operaciones del carrito (bypass RLS ya que validamos el usuario)
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { book_id, quantity = 1 } = body;

    if (!book_id) {
      return NextResponse.json({ error: 'book_id es requerido' }, { status: 400 });
    }

    // Verificar que el libro existe y está disponible
    const { data: book, error: bookError } = await admin
      .from('books')
      .select('*')
      .eq('book_id', book_id)
      .single();

    if (bookError || !book) {
      return NextResponse.json({ error: 'Libro no encontrado' }, { status: 404 });
    }

    if (book.status !== 'available') {
      return NextResponse.json({ error: 'El libro no está disponible' }, { status: 400 });
    }

    // Verificar si el item ya existe en el carrito
    const { data: existingItem } = await admin
      .from('cart')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', book_id)
      .single();

    if (existingItem) {
      // Actualizar cantidad
      const newQuantity = existingItem.quantity + quantity;
      const { error: updateError } = await admin
        .from('cart')
        .update({ quantity: newQuantity })
        .eq('cart_id', existingItem.cart_id);

      if (updateError) {
        console.error('Error updating cart:', updateError);
        if (updateError.code === '42P01' || updateError.message?.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'La tabla cart no existe. Por favor, aplica la migración 003_orders_system.sql en Supabase.',
            details: updateError.message,
            code: updateError.code
          }, { status: 500 });
        }
        if (updateError.code === '42501' || updateError.message?.includes('permission denied')) {
          return NextResponse.json({ 
            error: 'Error de permisos. Verifica que las políticas RLS estén configuradas correctamente.',
            details: updateError.message,
            code: updateError.code
          }, { status: 500 });
        }
        return NextResponse.json({ 
          error: 'Error al actualizar el carrito',
          details: updateError.message,
          code: updateError.code
        }, { status: 500 });
      }
    } else {
      // Insertar nuevo item
      const { error: insertError } = await admin
        .from('cart')
        .insert({
          user_id: user.id,
          book_id,
          quantity,
        });

      if (insertError) {
        console.error('Error inserting cart:', insertError);
        // Si el error es que la tabla no existe, dar un mensaje más claro
        if (insertError.code === '42P01' || insertError.message?.includes('does not exist')) {
          return NextResponse.json({ 
            error: 'La tabla cart no existe. Por favor, aplica la migración 003_orders_system.sql en Supabase.',
            details: insertError.message,
            code: insertError.code
          }, { status: 500 });
        }
        // Si el error es de RLS (permisos), dar un mensaje más claro
        if (insertError.code === '42501' || insertError.message?.includes('permission denied')) {
          return NextResponse.json({ 
            error: 'Error de permisos. Verifica que las políticas RLS estén configuradas correctamente.',
            details: insertError.message,
            code: insertError.code,
            hint: insertError.hint
          }, { status: 500 });
        }
        return NextResponse.json({ 
          error: 'Error al agregar al carrito',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API /api/cart POST error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT - Actualizar cantidad de un item
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

    if (!supabaseServiceRoleKey) {
      return NextResponse.json({ error: 'Service role key no configurada' }, { status: 500 });
    }

    // Usar service role key para operaciones del carrito (bypass RLS ya que validamos el usuario)
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await request.json();
    const { book_id, quantity } = body;

    if (!book_id || quantity === undefined) {
      return NextResponse.json({ error: 'book_id y quantity son requeridos' }, { status: 400 });
    }

    if (quantity <= 0) {
      // Eliminar el item si la cantidad es 0 o menor
      const { error: deleteError } = await admin
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', book_id);

      if (deleteError) {
        console.error('Error deleting cart item:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar del carrito' }, { status: 500 });
      }
    } else {
      // Actualizar cantidad
      const { error: updateError } = await admin
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('book_id', book_id);

      if (updateError) {
        console.error('Error updating cart:', updateError);
        return NextResponse.json({ error: 'Error al actualizar el carrito' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API /api/cart PUT error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE - Eliminar item del carrito o limpiar todo el carrito
export async function DELETE(request: Request) {
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

    // Usar service role key para operaciones del carrito (bypass RLS ya que validamos el usuario)
    const admin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { searchParams } = new URL(request.url);
    const book_id = searchParams.get('book_id');

    if (book_id) {
      // Eliminar un item específico
      const { error: deleteError } = await admin
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('book_id', book_id);

      if (deleteError) {
        console.error('Error deleting cart item:', deleteError);
        return NextResponse.json({ error: 'Error al eliminar del carrito' }, { status: 500 });
      }
    } else {
      // Limpiar todo el carrito
      const { error: deleteError } = await admin
        .from('cart')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error clearing cart:', deleteError);
        return NextResponse.json({ error: 'Error al limpiar el carrito' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('API /api/cart DELETE error:', error);
    const msg = error instanceof Error ? error.message : 'Error inesperado';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

