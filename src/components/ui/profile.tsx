"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { useCategories } from '@/hooks/useCategories';

type ProfileData = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  genres?: string[] | null;
};

export default function ProfileForm({
  initialData,
  onSaved,
}: {
  initialData?: ProfileData | null;
  onSaved?: (profile?: unknown) => void;
}) {
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [genres, setGenres] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const { categories, loading: loadingCategories } = useCategories();

  const toggleGenre = (categoryId: string) => {
    setMessage(null);
    setGenres((prev) => {
      if (prev.includes(categoryId)) return prev.filter((g) => g !== categoryId);
      if (prev.length >= 5) {
        setMessage("Puedes seleccionar hasta 5 géneros como máximo.");
        return prev;
      }
      return [...prev, categoryId];
    });
  };

  React.useEffect(() => {
    if (initialData) {
      setFirstName(initialData.first_name ?? "");
      setLastName(initialData.last_name ?? "");
      setBirthDate(initialData.birth_date ?? "");
      setGenres(initialData.genres ?? []);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        setMessage("No autenticado. Por favor inicia sesión.");
        setLoading(false);
        return;
      }

      const payload = {
        first_name: firstName,
        last_name: lastName,
        birth_date: birthDate || null,
        genres,
      };

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        setMessage(json.error || "Error guardando perfil");
      } else {
        setMessage("Perfil guardado correctamente.");
        onSaved?.(json.profile ?? null);
      }
    } catch (err) {
      setMessage((err as Error).message || "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md p-4 bg-white dark:bg-neutral-900 rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-neutral-800 dark:text-neutral-100">Mi perfil</h3>
      <label className="block mb-3">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">Nombre</span>
        <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" />
      </label>
      <label className="block mb-3">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">Apellidos</span>
        <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellidos" />
      </label>
      <label className="block mb-3">
        <span className="text-sm text-neutral-700 dark:text-neutral-300">Fecha de nacimiento</span>
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="w-full px-3 py-2 rounded-md border" />
      </label>

      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-700 dark:text-neutral-300">Géneros de interés (máx. 5)</span>
          <span className="text-xs text-neutral-500">Seleccionados: {genres.length}/5</span>
        </div>

        <div className="mt-2">
          <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Buscar género..." />
        </div>

        <div className="mt-2 max-h-48 overflow-auto border rounded-md p-2 bg-white dark:bg-neutral-900">
          {loadingCategories ? (
            <p className="text-sm text-neutral-500">Cargando géneros...</p>
          ) : (
            (categories || [])
              .filter((c) => c.category_name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((cat) => (
                <label key={cat.category_id} className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={genres.includes(cat.category_id)}
                    onChange={() => toggleGenre(cat.category_id)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{cat.category_name}</span>
                </label>
              ))
          )}
        </div>
      </div>

      {message && <p className="text-sm text-red-500 mb-3">{message}</p>}

      <div className="flex justify-end">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
