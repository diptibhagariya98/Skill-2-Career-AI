/**
 * Universal API Fetch Client
 * Automatically attaches Supabase Anon Key headers when targeting Supabase Edge Functions,
 * or standard JSON headers when targeting Next.js serverless functions.
 */

export async function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const isSupabaseEdge = url.includes(".supabase.co/functions/v1");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Supabase Edge Functions require apikey / Authorization headers
  if (isSupabaseEdge && anonKey) {
    if (!headers.has("apikey")) {
      headers.set("apikey", anonKey);
    }
    if (!headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${anonKey}`);
    }
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
