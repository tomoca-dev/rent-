import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const validUrl = typeof supabaseUrl === 'string' && /^https:\/\/.+\.supabase\.co$/i.test(supabaseUrl);
const validKey = typeof supabaseAnonKey === 'string' && supabaseAnonKey.length > 20;

export const supabase = validUrl && validKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : null;

export const supabaseConfigured = Boolean(supabase);
export const supabaseConfigMessage = supabase
  ? 'Supabase configured'
  : 'Using local browser storage until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are provided.';
