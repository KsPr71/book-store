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

    // Completar el progreso
    if (onProgress) {
      onProgress({ loaded: file.size, total: file.size });
    }

    // Obtener la URL pública de la imagen
    // data.path ya incluye el nombre del archivo con su ruta completa
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    const publicUrl = urlData.publicUrl;
    console.log(`[Storage] Imagen subida exitosamente. Bucket: ${bucket}, Path: ${data.path}, URL: ${publicUrl}`);

    return { url: publicUrl, error: null };
  } catch (error: any) {
    console.error('Error in uploadImage:', error);
    return { url: null, error: error.message || 'Error al subir la imagen' };
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
  } catch (error: any) {
    console.error('Error in deleteImage:', error);
    return { error: error.message || 'Error al eliminar la imagen' };
  }
}

