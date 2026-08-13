import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://veklqzdrxtogmyxjdpib.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_N5kXGwPVjsUEf7TMcErDIg_Y09FrNH6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type ScoreRow = {
  id: string;
  user_id: string;
  score: number;
  doors_opened: number;
  completion_time_seconds: number;
  created_at: string;
};
