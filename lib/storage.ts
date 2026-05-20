import { createClient } from '@supabase/supabase-js';

// Fallback to dummy values to prevent crashes if env vars are missing during build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

export const supabase = createClient(supabaseUrl, supabaseKey);

export interface Claim {
  id: string;
  created_at: string;
  flight_number: string;
  passenger_name: string;
  pnr: string;
  airline_email: string;
  status: 'pending' | 'paid' | 'dispatched' | 'failed';
}

export const saveClaim = async (claim: Claim) => {
  const { data, error } = await supabase
    .from('claims')
    .upsert([claim], { onConflict: 'pnr,flight_number' })
    .select();

  if (error) throw error;
  return data?.[0] || claim;
};

export const updateClaimStatus = async (id: string, status: Claim['status']) => {
  const { data, error } = await supabase
    .from('claims')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const updateClaimDetails = async (id: string, updates: Partial<Claim>) => {
  const { data, error } = await supabase
    .from('claims')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data?.[0];
};

export const getClaimById = async (id: string): Promise<Claim | undefined> => {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // Ignore "no rows returned" error
  return data || undefined;
};
