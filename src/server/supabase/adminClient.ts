import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { ApiError } from "@/server/utils/errors";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL is not defined");
}

let cachedClient: ReturnType<typeof createClient<Database>> | null = null;

// Service-role client is only used server-side for privileged operations.
export function getSupabaseAdmin() {
  if (cachedClient) {
    return cachedClient;
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new ApiError(
      500,
      "SUPABASE_SERVICE_ROLE_KEY is not configured on the server. Add it to your environment variables to enable admin API routes.",
    );
  }

  cachedClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: "public",
    },
  });

  return cachedClient;
}
