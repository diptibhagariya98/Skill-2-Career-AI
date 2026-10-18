import { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

/**
 * Extracts and verifies the Supabase session token from the Authorization header.
 * Returns the authenticated Supabase User object, or null if unauthenticated.
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return null;
  }

  try {
    const supabase = getServiceSupabase();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}
