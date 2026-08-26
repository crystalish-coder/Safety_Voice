import { createBrowserClient } from "@supabase/ssr";

let supabaseBrowserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseBrowserClient) {
    supabaseBrowserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return supabaseBrowserClient;
}
