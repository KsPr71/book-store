'use client';

import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { createCategory } from '@/lib/supabase/admin-categories';
import { getAllCategories } from '@/lib/supabase/categories';
import { useCategories } from '@/hooks';
import type { Category } from '@/types/database';

export function CategoryForm() {
  const { refreshAll } = useCategories();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    parent_category_id: '',
  });

  useEffect(() => {
    getAllCategories().then((data) => {
      setCategories(data || []);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const result = await createCategory({
        category_name: formData.category_name,
        description: formData.description || null,
        parent_category_id: formData.parent_category_id || null,
      });

      if (result.error || !result.data) {
        setError(result.error || 'Error al crear la categoría');
        setLoading(false);
        return;
      }

      setSuccess(true);
      refreshAll();
      
      // Actualizar lista de categorías
      const updatedCategories = await getAllCategories();
      setCategories(updatedCategories || []);

      // Resetear formulario
      setTimeout(() => {
        setFormData({
          category_name: '',
          description: '',
          parent_category_id: '',
        });
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
          Agregar Nueva Categoría
        </h3>

        {error && (
          <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
            <p className="text-sm text-green-800 dark:text-green-200">
              ✓ Categoría creada exitosamente
            </p>
          </div>
        )}

        {/* Nombre de la categoría */}
        <div>
          <Label htmlFor="category_name">Nombre de la categoría *</Label>
          <Input
            id="category_name"
            value={formData.category_name}
            onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
            required
          />
        </div>

        {/* Descripción */}
        <div>
          <Label htmlFor="description">Descripción</Label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full min-h-[100px] px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
            rows={4}
          />
        </div>

        {/* Categoría padre (subcategoría) */}
        <div>
          <Label htmlFor="parent_category_id">Categoría padre (para subcategorías)</Label>
          <select
            id="parent_category_id"
            value={formData.parent_category_id}
            onChange={(e) => setFormData({ ...formData, parent_category_id: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
          >
            <option value="">Ninguna (categoría principal)</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creando...' : 'Crear Categoría'}
        </button>
      </div>
    </form>
  );
}

