import { supabase } from './client';

export interface UploadProgress {
  loaded: number;
  total: number;
}

/**
 * Sube una imagen a Supabase Storage con barra de progreso
 * Nota: Supabase Storage no soporta progress events nativamente,
 * pero simulamos el progreso basado en el tamaño del archivo
 */
export async function uploadImage(
  bucket: string,
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string | null; error: string | null }> {
  try {
    // Simular progreso de carga (Supabase no tiene eventos de progreso nativos)
    let progressInterval: NodeJS.Timeout | null = null;
    
    if (onProgress) {
      let simulatedProgress = 0;
      progressInterval = setInterval(() => {
        simulatedProgress += 10;
        if (simulatedProgress < 90) {
          onProgress({
            loaded: (file.size * simulatedProgress) / 100,
            total: file.size,
          });
        }
      }, 200);
    }

    // Subir a Supabase Storage
    // El path debe ser relativo dentro del bucket, sin incluir el nombre del bucket
    console.log(`[Storage] Subiendo imagen. Bucket: ${bucket}, Path: ${path}`);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (progressInterval) {
      clearInterval(progressInterval);
    }

    if (error) {
      console.error('Error uploading file:', error);
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size });
      }
      return { url: null, error: error.message };
    }

    if (!data || !data.path) {
      console.error('Error: Upload succeeded but no data.path returned');
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size });
      }
      return { url: null, error: 'Upload succeeded but no path returned' };
    }

    // Completar el progreso
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size });
    }

    // Obtener la URL pública de la imagen
    // data.path es el path relativo dentro del bucket (ej: "temp-123456.jpg" o "authors/author-123.jpg")
    // No debe incluir el nombre del bucket
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      console.error('Error: Failed to get public URL for path:', data.path);
      return { url: null, error: 'Failed to generate public URL' };
    }

    const publicUrl = urlData.publicUrl;
    
    // Validar que la URL contiene el bucket correcto
    if (!publicUrl.includes(bucket)) {
      console.warn(`[Storage] ⚠️ La URL generada no contiene el nombre del bucket '${bucket}'. URL: ${publicUrl}`);
    }
    
    console.log(`[Storage] ✅ Imagen subida exitosamente. Bucket: ${bucket}, Path: ${data.path}, URL: ${publicUrl}`);

    return { url: publicUrl, error: null };
  } catch (error: unknown) {
    console.error('Error in uploadImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al subir la imagen';
    return { url: null, error: errorMessage };
  }
}

/**
 * Sube una imagen de portada de libro
 */
export async function uploadBookCover(
  bookId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string | null; error: string | null }> {
  const extension = file.name.split('.').pop();
  const fileName = `${bookId}-${Date.now()}.${extension}`;
  // El path debe incluir la carpeta portadas dentro del bucket portadas
  // Resultado: bucket/portadas/portadas/nombre-archivo.jpg
  const path = `portadas/${fileName}`;
  
  return uploadImage('portadas', file, path, onProgress);
}

/**
 * Sube una imagen de autor
 */
export async function uploadAuthorPhoto(
  authorId: string,
  file: File,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ url: string | null; error: string | null }> {
  const extension = file.name.split('.').pop();
  const fileName = `${authorId}-${Date.now()}.${extension}`;
  const path = `authors/${fileName}`;
  
  return uploadImage('authors', file, path, onProgress);
}

/**
 * Elimina una imagen de Supabase Storage
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      console.error('Error deleting file:', error);
      return { error: error.message };
    }
    
    return { error: null };
  } catch (error: unknown) {
    console.error('Error in deleteImage:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la imagen';
    return { error: errorMessage };
  }
}

