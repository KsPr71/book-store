'use client';

import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ImageUploader } from '@/components/ui/image-uploader';
import { createAuthor } from '@/lib/supabase/admin-authors';
import { uploadAuthorPhoto } from '@/lib/supabase/storage';
import { useAuthors } from '@/hooks';

export function AuthorForm() {
  const { refreshAll } = useAuthors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    biography: '',
    birth_date: '',
    nationality: '',
    website: '',
  });

  const handleImageUpload = async (file: File) => {
    // Generar un ID temporal para el autor
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    const result = await uploadAuthorPhoto(tempId, file);

    if (result.url) {
      setPhotoUrl(result.url);
      console.log('Foto subida, URL:', result.url); // Debug
    } else if (result.error) {
      console.error('Error al subir foto:', result.error); // Debug
    }

    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      // Verificar que photoUrl esté definido antes de crear
      console.log('Foto URL antes de crear autor:', photoUrl); // Debug
      
      const authorData = {
        full_name: formData.full_name,
        biography: formData.biography || null,
        photo_url: photoUrl || null,
        birth_date: formData.birth_date || null,
        nationality: formData.nationality || null,
        website: formData.website || null,
      };
      
      console.log('Datos del autor a crear:', authorData); // Debug
      
      const result = await createAuthor(authorData);

      if (result.error || !result.data) {
        setError(result.error || 'Error al crear el autor');
        setLoading(false);
        return;
      }
      
      console.log('Autor creado exitosamente:', result.data); // Debug

      setSuccess(true);
      refreshAll();

      // Resetear formulario
      setTimeout(() => {
        setFormData({
          full_name: '',
          biography: '',
          birth_date: '',
          nationality: '',
          website: '',
        });
        setPhotoUrl(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-4">
          Agregar Nuevo Autor
        </h3>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Autor creado exitosamente
            </p>
          </div>
        )}

        {/* Foto del autor */}
        <ImageUploader
          label="Foto del autor"
          onUpload={handleImageUpload}
          currentImageUrl={photoUrl}
        />
        
        {/* Debug: mostrar URL actual si está disponible */}
        {photoUrl && (
          <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-200 dark:border-green-800">
            <p className="font-medium">✓ Imagen cargada:</p>
            <p className="break-all">{photoUrl}</p>
          </div>
        )}

        {/* Nombre completo */}
        <div>
          <Label htmlFor="full_name">Nombre completo *</Label>
          <Input
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            required
          />
        </div>

        {/* Biografía */}
        <div>
          <Label htmlFor="biography">Biografía</Label>
          <textarea
            id="biography"
            value={formData.biography}
            onChange={(e) => setFormData({ ...formData, biography: e.target.value })}
            className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            rows={4}
          />
        </div>

        {/* Fecha de nacimiento y Nacionalidad */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="birth_date">Fecha de nacimiento</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="nationality">Nacionalidad</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            />
          </div>
        </div>

        {/* Sitio web */}
        <div>
          <Label htmlFor="website">Sitio web</Label>
          <Input
            id="website"
            type="url"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Autor'}
        </button>
      </div>
    </form>
  );
}

