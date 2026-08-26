import { createBrowserClient } from "@supabase/ssr";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

const DEFAULT_SUPABASE_URL = "https://yvgqmwkastzebodbrsog.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl2Z3Ftd2thc3R6ZWJvZGJyc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MTI1MTcsImV4cCI6MjEwMzI4ODUxN30.KTl01kC_uLDel7ljQ0rFLYmBTLANcJ92tWeINGMr9Z0";

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseBrowserClient;
}
