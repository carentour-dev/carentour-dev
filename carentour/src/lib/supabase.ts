import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://zfidusggwrarnjbsgkva.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpmaWR1c2dnd3Jhcm5qYnNna3ZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgxMTE0MTYsImV4cCI6MjA3MzY4NzQxNn0.P8_hdEyLH2SULAaUkGrfu4Z5UudCwbbFtQuwL4mwuyw";

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});