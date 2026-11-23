import { createClient } from '@supabase/supabase-js';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

const SUPABASE_URL =
  env.VITE_SUPABASE_URL?.trim() || 'https://wkkvehuckymlrsweyjjf.supabase.co';
const SUPABASE_PUBLIC_KEY =
  env.VITE_SUPABASE_ANON_KEY?.trim() || 'sb_publishable_LlU1uakjbI17_gcweZPXrg_tINTOf2J';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
