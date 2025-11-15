"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import ProfileForm from '@/components/ui/profile';
import { supabase } from '@/lib/supabase/client';
import { useCategories } from '@/hooks';

type ProfileData = {
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  phone_number?: string | null;
  genres?: string[] | null;
};

export default function ProfilePage() {
  const [profile, setProfile] = React.useState<ProfileData | null | undefined>(undefined);
  const [loading, setLoading] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const { categories } = useCategories();

  const loadProfile = React.useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const json = await res.json();
      setProfile(json.profile ?? null);
    } catch (err) {
      console.error('Error loading profile', err);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Redirect to /login if user is not authenticated (client-side)
  const router = useRouter();
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (mounted && !accessToken) {
        router.push('/login');
      }
    })();
    return () => { mounted = false; };
  }, [router]);

  const calculateAge = (dateString?: string | null) => {
    if (!dateString) return null;
    const dob = new Date(dateString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const fullName = () => {
    if (profile && (profile.first_name || profile.last_name)) {
      return `${profile.first_name ?? ''}${profile.last_name ? ' ' + profile.last_name : ''}`.trim();
    }
    return '';
  };

  return (
    <main className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>

      {loading && <p>Cargando perfil...</p>}

      {!loading && profile === null && (
        <div>
          <p className="mb-4">No se encontró perfil. Por favor crea tu perfil.</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md" onClick={() => setEditing(true)}>
            Crear perfil
          </button>
        </div>
      )}

      {!loading && profile && !editing && (
        <div className="bg-white dark:bg-neutral-900 p-6 rounded-md">
          <p className="mb-2">Usuario autenticado: <strong>{fullName() || '—'}</strong></p>
          <p className="mb-2">Edad: <strong>{calculateAge(profile.birth_date) ?? '—'}</strong></p>
          <p className="mb-2">Preferencias de lectura: <strong>{(profile.genres && profile.genres.length > 0) ? (profile.genres.map(id => categories.find(c => c.category_id === id)?.category_name).filter(Boolean) as string[]).join(', ') : '—'}</strong></p>
          <div className="mt-4">
            <button className="px-4 py-2 bg-green-600 text-white rounded-md mr-2" onClick={() => setEditing(true)}>Editar perfil</button>
            <button className="px-4 py-2 bg-gray-200 rounded-md" onClick={loadProfile}>Refrescar</button>
          </div>
        </div>
      )}

      {!loading && editing && (
        <div>
          <ProfileForm initialData={profile ?? undefined} onSaved={() => { setEditing(false); loadProfile(); }} />
        </div>
      )}
    </main>
  );
}
