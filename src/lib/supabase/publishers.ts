import { supabase } from './client';
import type { Publisher } from '@/types/database';

// Obtener todos los editores
export async function getAllPublishers(): Promise<Publisher[]> {
  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching publishers:', error);
    throw error;
  }

  return data || [];
}

// Obtener editor por ID
export async function getPublisherById(publisherId: string): Promise<Publisher | null> {
  const { data, error } = await supabase
    .from('publishers')
    .select('*')
    .eq('publisher_id', publisherId)
    .single();

  if (error) {
    console.error('Error fetching publisher:', error);
    return null;
  }

  return data;
}

