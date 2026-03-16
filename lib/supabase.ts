import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uzjjjuvcbzcigocwrbyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6ampqdXZjYnpjaWdvY3dyYnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MTQ5NTMsImV4cCI6MjA4OTE5MDk1M30.npqecOl1aveuGvzx-6sFwZv_vSjyblGuSL6nNJJ_IfE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
