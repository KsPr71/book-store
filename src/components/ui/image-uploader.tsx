'use client';

import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

interface ImageUploaderProps {
  onUpload: (file: File) => Promise<{ url: string | null; error: string | null }>;
  onProgress?: (progress: number) => void;
  currentImageUrl?: string | null;
  label?: string;
  accept?: string;
}

export function ImageUploader({
  onUpload,
  onProgress,
  currentImageUrl,
  label = 'Subir imagen',
  accept = 'image/*',
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sincronizar preview con currentImageUrl cuando cambia desde el padre
  // Solo cuando se carga inicialmente o cuando el padre actualiza explícitamente
  React.useEffect(() => {
    if (currentImageUrl && !uploading && !uploadedUrl) {
      // Solo actualizar si no hay una URL subida recientemente
      setPreview(currentImageUrl);
      setUploadedUrl(currentImageUrl);
    }
  }, [currentImageUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapper para onUpload que actualiza el progreso
  const handleUpload = async (file: File) => {
    return onUpload(file).then((result) => {
      // El progreso se maneja dentro de la función onUpload
      return result;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('La imagen debe ser menor a 5MB');
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    // Crear preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Subir archivo con callback de progreso
    try {
      const result = await handleUpload(file);
      
      if (result.error) {
        setError(result.error);
        setPreview(currentImageUrl || null);
        setProgress(0);
      } else if (result.url) {
        setUploadedUrl(result.url);
        // Forzar actualización del preview con la nueva URL
        setPreview(result.url);
        setProgress(100);
        if (onProgress) onProgress(100);
        // Notificar al componente padre que la URL está lista
        console.log('✅ URL de imagen obtenida:', result.url); // Debug
        console.log('📸 Preview actualizado con URL:', result.url); // Debug
      }
    } catch {
      setError('Error al subir la imagen');
      setPreview(currentImageUrl || null);
      setProgress(0);
    } finally {
      setUploading(false);
      // Resetear el input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setUploadedUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      
      <div className="relative">
        {preview ? (
          <div className="relative w-full h-64 rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700">
            <Image
              key={preview}
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 400px"
              unoptimized={preview.includes('supabase')}
              onError={() => {
                console.error('Error loading preview image:', preview);
                // No ocultar la imagen, solo loguear el error
                // El usuario puede ver que hay un problema
              }}
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors"
              aria-label="Eliminar imagen"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="relative w-full h-64 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors bg-neutral-50 dark:bg-neutral-900"
          >
            <Upload className="h-12 w-12 text-neutral-400 dark:text-neutral-500 mb-2" />
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {uploading ? 'Subiendo...' : 'Haz click para subir una imagen'}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
              PNG, JPG hasta 5MB
            </p>
          </div>
        )}

        {uploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-neutral-900/80 dark:bg-neutral-950/80 p-2 rounded-b-lg">
            <div className="h-2 bg-neutral-700 dark:bg-neutral-600 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-white text-center mt-1">
              {Math.round(progress)}%
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {uploadedUrl && !error && (
        <p className="text-sm text-green-600 dark:text-green-400">
          ✓ Imagen subida exitosamente
        </p>
      )}

      {uploadedUrl && (
        <input
          type="hidden"
          name="imageUrl"
          value={uploadedUrl}
        />
      )}
    </div>
  );
}

