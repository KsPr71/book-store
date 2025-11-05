/**
 * Servicio para buscar libros en Open Library API
 * Documentación: https://openlibrary.org/developers/api
 */

export interface OpenLibraryBook {
  key: string;
  title: string;
  subtitle?: string;
  authors?: Array<{
    key: string;
    name: string;
  }>;
  first_publish_year?: number;
  publish_year?: number[];
  number_of_pages_median?: number;
  language?: string[];
  isbn?: string[];
  cover_i?: number;
  cover_edition_key?: string;
  description?: string | { value?: string; type?: string };
  publisher?: string[];
  subjects?: string[];
}

export interface OpenLibrarySearchResult {
  numFound: number;
  start: number;
  numFoundExact: boolean;
  docs: OpenLibraryBook[];
}

export interface OpenLibraryBookDetails {
  title: string;
  subtitle?: string;
  description?: string | { value?: string; type?: string };
  authors?: Array<{
    key: string;
    name: string;
  }>;
  publish_date?: string;
  publishers?: string[];
  number_of_pages?: number;
  languages?: Array<{ key: string }>;
  isbn_13?: string[];
  isbn_10?: string[];
  covers?: number[];
  subjects?: Array<{ name: string }>;
}

/**
 * Busca libros en Open Library por título
 * @param title - Título del libro a buscar
 * @param limit - Número máximo de resultados (default: 10)
 * @returns Array de libros encontrados
 */
export async function searchBooksByTitle(
  title: string,
  limit: number = 10
): Promise<OpenLibraryBook[]> {
  try {
    const encodedTitle = encodeURIComponent(title);
    const url = `https://openlibrary.org/search.json?title=${encodedTitle}&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al buscar en Open Library: ${response.statusText}`);
    }
    
    const data: OpenLibrarySearchResult = await response.json();
    return data.docs || [];
  } catch (error) {
    console.error('Error buscando en Open Library:', error);
    throw error;
  }
}

/**
 * Busca libros en Open Library por ISBN
 * @param isbn - ISBN del libro
 * @returns Datos del libro o null si no se encuentra
 */
export async function searchBookByISBN(isbn: string): Promise<OpenLibraryBookDetails | null> {
  try {
    // Limpiar ISBN (remover guiones y espacios)
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${cleanISBN}&format=json&jscmd=data`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al buscar ISBN en Open Library: ${response.statusText}`);
    }
    
    const data = await response.json();
    const bookKey = `ISBN:${cleanISBN}`;
    
    if (!data[bookKey]) {
      return null;
    }
    
    const bookData = data[bookKey];
    
    // Si tiene work key, obtener más detalles del trabajo
    if (bookData.works && bookData.works.length > 0) {
      const workKey = bookData.works[0].key;
      try {
        const workDetails = await getBookDetailsByWorkKey(workKey);
        if (workDetails) {
          // Combinar datos: usar work details como base y complementar con datos del ISBN
          return {
            ...workDetails,
            // Preferir datos del ISBN si están disponibles (más específicos)
            title: bookData.title || workDetails.title,
            subtitle: bookData.subtitle || workDetails.subtitle,
            publish_date: bookData.publish_date || workDetails.publish_date,
            publishers: bookData.publishers || workDetails.publishers,
            number_of_pages: bookData.number_of_pages || workDetails.number_of_pages,
            // Usar covers del ISBN si están disponibles (mejor calidad)
            covers: bookData.covers || workDetails.covers,
            // Combinar autores
            authors: bookData.authors || workDetails.authors,
            // Usar ISBN del ISBN search
            isbn_13: bookData.isbn_13 || workDetails.isbn_13,
            isbn_10: bookData.isbn_10 || workDetails.isbn_10,
          };
        }
      } catch (error) {
        console.warn('No se pudieron obtener detalles del work, usando datos básicos:', error);
      }
    }
    
    return bookData;
  } catch (error) {
    console.error('Error buscando ISBN en Open Library:', error);
    return null;
  }
}

/**
 * Obtiene detalles completos de un libro por su work key
 * @param workKey - Key del trabajo (ej: "/works/OL82563W")
 * @returns Detalles del libro o null si no se encuentra
 */
export async function getBookDetailsByWorkKey(
  workKey: string
): Promise<OpenLibraryBookDetails | null> {
  try {
    // Asegurar que la key tenga el formato correcto
    const cleanKey = workKey.startsWith('/') ? workKey : `/${workKey}`;
    const url = `https://openlibrary.org${cleanKey}.json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error obteniendo detalles del libro:', error);
    return null;
  }
}

/**
 * Obtiene la URL de la imagen de portada de Open Library
 * @param coverId - ID de la portada
 * @param size - Tamaño: 'small', 'medium', 'large' (default: 'medium')
 * @returns URL de la imagen
 */
export function getCoverImageUrl(coverId?: number, size: 'small' | 'medium' | 'large' = 'medium'): string | null {
  if (!coverId) return null;
  
  const sizes = {
    small: 'S',
    medium: 'M',
    large: 'L'
  };
  
  return `https://covers.openlibrary.org/b/id/${coverId}-${sizes[size]}.jpg`;
}

/**
 * Obtiene la URL de la imagen de portada por ISBN
 * @param isbn - ISBN del libro
 * @param size - Tamaño: 'small', 'medium', 'large' (default: 'medium')
 * @returns URL de la imagen
 */
export function getCoverImageUrlByISBN(isbn: string, size: 'small' | 'medium' | 'large' = 'medium'): string {
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  const sizes = {
    small: 'S',
    medium: 'M',
    large: 'L'
  };
  
  return `https://covers.openlibrary.org/b/isbn/${cleanISBN}-${sizes[size]}.jpg`;
}

/**
 * Convierte un libro de Open Library al formato de la base de datos
 * @param openLibraryBook - Libro de Open Library
 * @returns Objeto con los datos formateados para la base de datos
 */
export function formatOpenLibraryBookForDatabase(openLibraryBook: OpenLibraryBook) {
  // Extraer descripción
  let description: string | undefined;
  if (openLibraryBook.description) {
    if (typeof openLibraryBook.description === 'string') {
      description = openLibraryBook.description;
    } else if (openLibraryBook.description.value) {
      description = openLibraryBook.description.value;
    }
  }
  
  // Extraer año de publicación
  const publishYear = openLibraryBook.first_publish_year || 
                     (openLibraryBook.publish_year && openLibraryBook.publish_year[0]) || 
                     undefined;
  
  // Extraer idioma
  const language = openLibraryBook.language?.[0]?.split('/').pop() || 'es';
  
  // Extraer ISBN
  const isbn = openLibraryBook.isbn?.[0] || undefined;
  
  // Obtener URL de portada
  const coverImageUrl = openLibraryBook.cover_i 
    ? getCoverImageUrl(openLibraryBook.cover_i, 'large')
    : (isbn ? getCoverImageUrlByISBN(isbn, 'large') : null);
  
  return {
    title: openLibraryBook.title,
    subtitle: openLibraryBook.subtitle,
    description,
    isbn,
    publication_date: publishYear ? `${publishYear}-01-01` : undefined,
    page_count: openLibraryBook.number_of_pages_median,
    language: language,
    cover_image_url: coverImageUrl || undefined,
    // Datos adicionales para referencia
    openlibrary_key: openLibraryBook.key,
    openlibrary_work_key: openLibraryBook.cover_edition_key,
    authors: openLibraryBook.authors?.map(a => a.name) || [],
    publishers: openLibraryBook.publisher || [],
    subjects: openLibraryBook.subjects || [],
  };
}

