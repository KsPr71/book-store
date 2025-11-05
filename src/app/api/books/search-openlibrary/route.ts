import { NextResponse } from 'next/server';
import { 
  searchBooksByTitle, 
  searchBookByISBN,
  formatOpenLibraryBookForDatabase 
} from '@/lib/openlibrary';

/**
 * API Route para buscar libros en Open Library
 * 
 * GET /api/books/search-openlibrary?title={title}&limit={limit}
 * GET /api/books/search-openlibrary?isbn={isbn}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const title = searchParams.get('title');
    const isbn = searchParams.get('isbn');
    const workKey = searchParams.get('workKey');
    const limit = parseInt(searchParams.get('limit') || '10', 10);

      // Si viene workKey, obtener detalles completos del trabajo
    if (workKey) {
      const { getBookDetailsByWorkKey } = await import('@/lib/openlibrary');
      const workDetails = await getBookDetailsByWorkKey(workKey);
      
      if (!workDetails) {
        return NextResponse.json(
          { error: 'Libro no encontrado', book: null },
          { status: 404 }
        );
      }
      
      console.log('Work details completo:', JSON.stringify(workDetails, null, 2)); // Debug completo

      // El work puede tener ediciones. Necesitamos obtener el ISBN y fecha de las ediciones
      const workDetailsWithEditions = workDetails as typeof workDetails & {
        first_publish_date?: string;
        first_publish_year?: number;
        covers?: number[];
      };
      
      // Extraer año de publicación - intentar diferentes campos
      let publicationDate: string | undefined = undefined;
      
      // Intentar desde publish_date
      if (workDetails.publish_date) {
        if (typeof workDetails.publish_date === 'string') {
          if (!/^\d{4}-\d{2}-\d{2}/.test(workDetails.publish_date) && /^\d{4}/.test(workDetails.publish_date)) {
            publicationDate = workDetails.publish_date.substring(0, 4);
          } else {
            publicationDate = workDetails.publish_date.split('T')[0];
          }
        }
      }
      
      // Si no hay publish_date, intentar first_publish_date o first_publish_year
      if (!publicationDate && workDetailsWithEditions.first_publish_date) {
        const firstDate = workDetailsWithEditions.first_publish_date;
        if (!/^\d{4}-\d{2}-\d{2}/.test(firstDate) && /^\d{4}/.test(firstDate)) {
          publicationDate = firstDate.substring(0, 4);
        } else {
          publicationDate = firstDate.split('T')[0];
        }
      }
      
      if (!publicationDate && workDetailsWithEditions.first_publish_year) {
        publicationDate = String(workDetailsWithEditions.first_publish_year);
      }
      
      // Extraer ISBN - puede estar en el work o en las ediciones
      let isbn: string | undefined = undefined;
      
      // Intentar desde el work directamente
      if (workDetails.isbn_13 && workDetails.isbn_13.length > 0) {
        isbn = workDetails.isbn_13[0];
      } else if (workDetails.isbn_10 && workDetails.isbn_10.length > 0) {
        isbn = workDetails.isbn_10[0];
      }
      
      // Si no hay ISBN en el work, intentar obtenerlo de las ediciones
      if (!isbn) {
        // Intentar obtener de las ediciones del work
        try {
          // Buscar ediciones del work
          const cleanWorkKey = workKey.startsWith('/') ? workKey : `/${workKey}`;
          const editionsUrl = `https://openlibrary.org${cleanWorkKey}/editions.json?limit=5`;
          const editionsResponse = await fetch(editionsUrl);
          if (editionsResponse.ok) {
            const editionsData = await editionsResponse.json();
            if (editionsData.entries && editionsData.entries.length > 0) {
              // Buscar la primera edición que tenga ISBN
              for (const edition of editionsData.entries) {
                if (!isbn && edition.isbn_13 && edition.isbn_13.length > 0) {
                  isbn = edition.isbn_13[0];
                  // Si encontramos ISBN, usar esta edición para la fecha también
                  if (!publicationDate && edition.publish_date) {
                    const editionDate = String(edition.publish_date);
                    if (!/^\d{4}-\d{2}-\d{2}/.test(editionDate) && /^\d{4}/.test(editionDate)) {
                      publicationDate = editionDate.substring(0, 4);
                    } else {
                      publicationDate = editionDate.split('T')[0];
                    }
                  }
                  break;
                } else if (!isbn && edition.isbn_10 && edition.isbn_10.length > 0) {
                  isbn = edition.isbn_10[0];
                  // Si encontramos ISBN, usar esta edición para la fecha también
                  if (!publicationDate && edition.publish_date) {
                    const editionDate = String(edition.publish_date);
                    if (!/^\d{4}-\d{2}-\d{2}/.test(editionDate) && /^\d{4}/.test(editionDate)) {
                      publicationDate = editionDate.substring(0, 4);
                    } else {
                      publicationDate = editionDate.split('T')[0];
                    }
                  }
                  break;
                } else if (!publicationDate && edition.publish_date) {
                  // Si no hay ISBN pero sí fecha, guardarla
                  const editionDate = String(edition.publish_date);
                  if (!/^\d{4}-\d{2}-\d{2}/.test(editionDate) && /^\d{4}/.test(editionDate)) {
                    publicationDate = editionDate.substring(0, 4);
                  } else {
                    publicationDate = editionDate.split('T')[0];
                  }
                }
              }
            }
          }
        } catch (error) {
          console.warn('Error obteniendo ediciones para ISBN y fecha:', error);
        }
      }
      
      // Extraer descripción
      let description: string | undefined;
      if (workDetails.description) {
        if (typeof workDetails.description === 'string') {
          description = workDetails.description;
        } else if (workDetails.description.value) {
          description = workDetails.description.value;
        } else if (typeof workDetails.description === 'object' && 'value' in workDetails.description) {
          description = String(workDetails.description.value);
        }
      }
      
      console.log('ISBN extraído:', isbn); // Debug
      console.log('Fecha de publicación extraída:', publicationDate); // Debug
      
      // Formatear para respuesta
      const formatted = {
        title: workDetails.title,
        subtitle: workDetails.subtitle || undefined,
        description: description,
        isbn: isbn,
        publication_date: publicationDate || undefined,
        page_count: workDetails.number_of_pages || undefined,
        language: workDetails.languages?.[0]?.key?.split('/').pop() || 'es',
        authors: await (async () => {
          // Verificar si hay autores_key (array de keys de autores)
          const workDetailsWithKeys = workDetails as typeof workDetails & { authors_key?: string[] };
          
          if (!workDetails.authors || workDetails.authors.length === 0) {
            console.log('No hay autores en workDetails, verificando authors_key...');
            // Si hay authors_key, hacer fetch de cada autor
            if (workDetailsWithKeys.authors_key && Array.isArray(workDetailsWithKeys.authors_key) && workDetailsWithKeys.authors_key.length > 0) {
              console.log('Encontrados authors_key:', workDetailsWithKeys.authors_key);
              
              // Función helper para obtener nombre del autor desde su key
              const getAuthorNameFromKey = async (authorKey: string): Promise<string | null> => {
                try {
                  const cleanKey = authorKey.startsWith('/') ? authorKey : `/${authorKey}`;
                  const url = `https://openlibrary.org${cleanKey}.json`;
                  const response = await fetch(url);
                  if (response.ok) {
                    const authorData = await response.json();
                    return authorData.name || authorData.full_name || null;
                  }
                } catch (error) {
                  console.warn('Error obteniendo nombre del autor:', error);
                }
                return null;
              };
              
              const authorNames: string[] = [];
              const authorPromises = workDetailsWithKeys.authors_key.map(key => 
                getAuthorNameFromKey(key).then(name => {
                  if (name) authorNames.push(name);
                })
              );
              await Promise.all(authorPromises);
              
              console.log('Autores extraídos desde authors_key:', authorNames);
              return authorNames.filter((name: string) => name && name.trim() !== '');
            }
            return [];
          }
          
          console.log('Procesando autores del work:', JSON.stringify(workDetails.authors, null, 2)); // Debug
          
          // Función helper para obtener nombre del autor desde su key
          const getAuthorNameFromKey = async (authorKey: string): Promise<string | null> => {
            try {
              const cleanKey = authorKey.startsWith('/') ? authorKey : `/${authorKey}`;
              const url = `https://openlibrary.org${cleanKey}.json`;
              const response = await fetch(url);
              if (response.ok) {
                const authorData = await response.json();
                return authorData.name || authorData.full_name || null;
              }
            } catch (error) {
              console.warn('Error obteniendo nombre del autor:', error);
            }
            return null;
          };
          
          // Procesar autores - pueden venir en diferentes formatos
          const authorNames: string[] = [];
          const authorPromises: Promise<void>[] = [];
          
          for (const a of workDetails.authors) {
            if (typeof a === 'string') {
              authorNames.push(a);
            } else if (a && typeof a === 'object') {
              // Intentar diferentes campos
              if ('name' in a && typeof a.name === 'string') {
                authorNames.push(a.name);
              } else if ('full_name' in a && typeof a.full_name === 'string') {
                authorNames.push(a.full_name);
              } else if ('key' in a && typeof a.key === 'string') {
                // Si tiene key, hacer fetch para obtener el nombre
                authorPromises.push(
                  getAuthorNameFromKey(a.key).then(name => {
                    if (name) authorNames.push(name);
                  })
                );
              } else if ('author' in a && a.author && typeof a.author === 'object') {
                // Si tiene una estructura anidada author
                if ('name' in a.author && typeof a.author.name === 'string') {
                  authorNames.push(a.author.name);
                } else if ('key' in a.author && typeof a.author.key === 'string') {
                  // Si solo tiene key en author, hacer fetch
                  authorPromises.push(
                    getAuthorNameFromKey(a.author.key).then(name => {
                      if (name) authorNames.push(name);
                    })
                  );
                }
              }
            }
          }
          
          // Esperar a que se completen todos los fetches de autores
          await Promise.all(authorPromises);
          
          console.log('Autores extraídos:', authorNames); // Debug
          return authorNames.filter((name: string) => name && name.trim() !== '');
        })(),
        publishers: workDetails.publishers?.map((p: string | { name?: string }) => {
          if (typeof p === 'string') return p;
          if (p && typeof p === 'object' && p.name) return p.name;
          return String(p);
        }).filter((p: string) => p && p.trim() !== '') || [],
        subjects: workDetails.subjects?.map((s: { name?: string }) => s.name || String(s)) || [],
        cover_image_url: workDetails.covers?.[0] 
          ? `https://covers.openlibrary.org/b/id/${workDetails.covers[0]}-L.jpg`
          : (workDetails.isbn_13?.[0] || workDetails.isbn_10?.[0])
            ? `https://covers.openlibrary.org/b/isbn/${String(workDetails.isbn_13?.[0] || workDetails.isbn_10?.[0] || '').replace(/[-\s]/g, '')}-L.jpg`
            : undefined,
      };

      return NextResponse.json({ 
        success: true,
        book: formatted 
      });
    }

    if (!title && !isbn) {
      return NextResponse.json(
        { error: 'Se requiere "title", "isbn" o "workKey" como parámetro' },
        { status: 400 }
      );
    }

    if (isbn) {
      // Búsqueda por ISBN
      const bookDetails = await searchBookByISBN(isbn);
      
      if (!bookDetails) {
        return NextResponse.json(
          { error: 'Libro no encontrado', book: null },
          { status: 404 }
        );
      }

      // Extraer año de publicación si solo viene el año
      let publicationDate = bookDetails.publish_date;
      if (publicationDate && typeof publicationDate === 'string') {
        // Si solo tiene el año (ej: "2005"), mantenerlo así (se formateará en el frontend)
        if (!/^\d{4}-\d{2}-\d{2}/.test(publicationDate) && /^\d{4}/.test(publicationDate)) {
          publicationDate = publicationDate.substring(0, 4);
        }
      }
      
      // Extraer descripción (puede venir de diferentes lugares)
      let description: string | undefined;
      if (bookDetails.description) {
        if (typeof bookDetails.description === 'string') {
          description = bookDetails.description;
        } else if (bookDetails.description.value) {
          description = bookDetails.description.value;
        } else if (typeof bookDetails.description === 'object' && 'value' in bookDetails.description) {
          description = String(bookDetails.description.value);
        }
      }
      
      // Formatear para respuesta
      const formatted = {
        title: bookDetails.title,
        subtitle: bookDetails.subtitle || undefined,
        description: description,
        isbn: bookDetails.isbn_13?.[0] || bookDetails.isbn_10?.[0] || undefined,
        publication_date: publicationDate || undefined,
        page_count: bookDetails.number_of_pages || undefined,
        language: bookDetails.languages?.[0]?.key?.split('/').pop() || 'es',
        authors: bookDetails.authors?.map((a: { name?: string; full_name?: string }) => a.name || a.full_name || String(a)) || [],
        publishers: bookDetails.publishers || [],
        subjects: bookDetails.subjects?.map((s: { name?: string }) => s.name || String(s)) || [],
        cover_image_url: bookDetails.covers?.[0] 
          ? `https://covers.openlibrary.org/b/id/${bookDetails.covers[0]}-L.jpg`
          : (bookDetails.isbn_13?.[0] || bookDetails.isbn_10?.[0])
            ? `https://covers.openlibrary.org/b/isbn/${String(bookDetails.isbn_13?.[0] || bookDetails.isbn_10?.[0] || '').replace(/[-\s]/g, '')}-L.jpg`
            : undefined,
      };

      return NextResponse.json({ 
        success: true,
        book: formatted 
      });
    }

    // Búsqueda por título
    const books = await searchBooksByTitle(title!, limit);
    
    // Formatear resultados
    const formattedBooks = books.map(formatOpenLibraryBookForDatabase);

    return NextResponse.json({
      success: true,
      count: formattedBooks.length,
      books: formattedBooks,
    });
  } catch (error) {
    console.error('Error en búsqueda de Open Library:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Error al buscar en Open Library',
        success: false 
      },
      { status: 500 }
    );
  }
}

