import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lastCheckDate = searchParams.get('lastCheckDate');

    // Si no hay fecha de última verificación, usar las últimas 24 horas
    const since = lastCheckDate 
      ? new Date(lastCheckDate)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Obtener libros nuevos desde la última verificación
    const { data: books, error } = await supabase
      .from('books')
      .select('book_id, title, cover_image_url, created_at')
      .eq('status', 'available')
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching new books:', error);
      return NextResponse.json(
        { error: 'Error al obtener nuevos libros' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      newBooks: books || [],
      count: books?.length || 0,
      lastCheck: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in check-new-books API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

