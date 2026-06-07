import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Pet } from '@/types';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('pets')
      .select('*')
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });
    setPets((data ?? []) as Pet[]);
    setLoading(false);
  }, []);

  const upsert = useCallback(async (pet: Partial<Pet> & { name: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('pets')
      .upsert({ ...pet, user_id: user.id })
      .select()
      .single();
    if (!error) await load();
    return error ? null : data as Pet;
  }, [load]);

  const remove = useCallback(async (id: string) => {
    await supabase.from('pets').delete().eq('id', id);
    await load();
  }, [load]);

  const setPrimary = useCallback(async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('pets').update({ is_primary: false }).eq('user_id', user.id);
    await supabase.from('pets').update({ is_primary: true }).eq('id', id);
    await load();
  }, [load]);

  return { pets, loading, load, upsert, remove, setPrimary };
}
