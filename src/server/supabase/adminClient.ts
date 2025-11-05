import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ApiError } from "@/server/utils/errors";
import { headers } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

let cachedAdminClient: ReturnType<typeof createClient<Database>> | null = null;

// Service-role client is only used server-side for privileged operations.
export function getSupabaseAdmin() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new ApiError(
      500,
      "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to your environment variables to enable admin API routes.",
    );
  }

  cachedAdminClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });

  return cachedAdminClient;
}

/**
 * Creates a Supabase client with the current user's access token from the Authorization header.
 * This client respects RLS policies and operates in the user's context.
 * Use this for operations that should be filtered by RLS (e.g., Referral users seeing only their patients).
 *
 * @returns Supabase client with user authentication context (RLS applies)
 * @throws ApiError if no authorization header is present
 */
export async function getSupabaseWithAuth() {
  const authHeader = (await headers()).get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const accessToken = authHeader.slice(7).trim();

  if (!accessToken) {
    throw new ApiError(401, "Missing access token");
  }

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new ApiError(
      500,
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured on the server.",
    );
  }

  // Create a client with the user's access token
  // This client will respect RLS policies
  const client = createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    db: {
      schema: "public",
    },
  });

  return client;
}
