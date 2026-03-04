import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// Import the auto-generated supabase client
import { supabase } from '@/integrations/supabase/client';

export interface Prize {
  id: string;
  name: string;
  quantity: number;
  status: string;
  image_url: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface SpinHistory {
  id: string;
  prize_id: string;
  prize_name: string;
  spun_at: string;
}

export function usePrizes() {
  return useQuery({
    queryKey: ['prizes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Prize[];
    },
  });
}

export function useActivePrizes() {
  return useQuery({
    queryKey: ['prizes', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prizes')
        .select('*')
        .eq('status', 'active')
        .gt('quantity', 0)
        .order('name');
      if (error) throw error;
      return data as Prize[];
    },
  });
}

export function useSpinHistory() {
  return useQuery({
    queryKey: ['spin-history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spin_history')
        .select('*')
        .order('spun_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SpinHistory[];
    },
  });
}

export function useSpinPrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prizeId: string) => {
      const { data, error } = await supabase.rpc('spin_prize', {
        prize_id_param: prizeId,
      });
      if (error) throw error;
      return data as { success: boolean; prize_name?: string; remaining?: number; error?: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prizes'] });
      queryClient.invalidateQueries({ queryKey: ['spin-history'] });
    },
  });
}

export function useCreatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (prize: { name: string; quantity: number; status: string; color: string }) => {
      const { data, error } = await supabase.from('prizes').insert(prize).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prizes'] }),
  });
}

export function useUpdatePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; name?: string; quantity?: number; status?: string; color?: string }) => {
      const { data, error } = await supabase.from('prizes').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prizes'] }),
  });
}

export function useDeletePrize() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prizes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['prizes'] }),
  });
}
