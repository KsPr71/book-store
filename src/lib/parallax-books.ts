import type { Book } from '@/types/database';

export interface ParallaxBook {
  title: string;
  link: string;
  thumbnail: string;
  book_id: string;
  uniqueKey: string;
}

/**
 * Transforma los libros de la base de datos al formato requerido por HeroParallax
 */
export function transformBooksForParallax(
  books: Book[],
  loading: boolean
): ParallaxBook[] {
  if (loading) return [];

  // Debug: información general
  if (process.env.NODE_ENV === 'development') {
    console.log('📚 Total de libros cargados:', books.length);
    console.log('📊 Estado de los libros:', {
      total: books.length,
      available: books.filter((b) => b.status === 'available').length,
      draft: books.filter((b) => b.status === 'draft').length,
      out_of_stock: books.filter((b) => b.status === 'out_of_stock').length,
      conPortada: books.filter((b) => b.cover_image_url && b.cover_image_url.trim() !== '').length,
      disponibleConPortada: books.filter(
        (b) => b.status === 'available' && b.cover_image_url && b.cover_image_url.trim() !== ''
      ).length,
    });
  }

  if (!books.length) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ No hay libros en la base de datos');
    }
    return [];
  }

  // Filtrar libros disponibles o en draft con imagen de portada
  const booksWithCover = books
    .filter((book) => {
      const hasCover = book.cover_image_url && book.cover_image_url.trim() !== '';
      // Mostrar libros disponibles O libros con portada (para desarrollo)
      return (book.status === 'available' || book.status === 'draft') && hasCover;
    })
    .slice(0, 15); // Máximo 15 libros para el parallax

  // Debug: verificar URLs originales
  if (process.env.NODE_ENV === 'development' && booksWithCover.length > 0) {
    console.log('🖼️ URLs de portadas originales:');
    booksWithCover.forEach((book, index) => {
      console.log(`  ${index + 1}. "${book.title}": "${book.cover_image_url}"`);
    });
  }

  // Si aún no hay suficientes, aceptar libros sin portada (con placeholder)
  let finalBooks = booksWithCover;
  if (booksWithCover.length < 15) {
    const booksWithoutCover = books
      .filter((book) => {
        // No duplicar los que ya tenemos
        return !booksWithCover.some((b) => b.book_id === book.book_id);
      })
      .slice(0, 15 - booksWithCover.length);

    finalBooks = [...booksWithCover, ...booksWithoutCover];
  }

  // Transformar al formato requerido
  const transformedBooks: ParallaxBook[] = finalBooks.map((book, index) => ({
    title: book.title,
    link: `/book/${book.book_id}`, // Link a la página de detalle del libro
    thumbnail: book.cover_image_url || '', // URL de la portada (puede estar vacío)
    book_id: book.book_id, // Guardar ID para referencia
    uniqueKey: `${book.book_id}-${index}`, // Key única inicial
  }));

  // Debug: mostrar en consola los libros procesados
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Libros para parallax:', transformedBooks.length);
    transformedBooks.forEach((book, index) => {
      console.log(`  ${index + 1}. ${book.title} - ID: ${book.book_id} - Portada: ${book.thumbnail || '❌'}`);
    });
  }

  // Si hay suficientes libros (15 o más), retornar directamente
  if (transformedBooks.length >= 15) return transformedBooks;

  if (transformedBooks.length === 0) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ No hay libros con portada para mostrar');
    }
    return [];
  }

  // Si hay menos de 15 libros, retornar solo los disponibles sin duplicar
  // Esto evita mostrar múltiples copias del mismo libro
  if (process.env.NODE_ENV === 'development') {
    console.log(`ℹ️ Solo hay ${transformedBooks.length} libro(s). Mostrando sin duplicar.`);
    console.log('📸 Libros que se mostrarán:');
    transformedBooks.forEach((book, index) => {
      console.log(`  ${index + 1}. ${book.title}: ${book.thumbnail || 'SIN PORTADA'}`);
    });
  }

  return transformedBooks;
}

