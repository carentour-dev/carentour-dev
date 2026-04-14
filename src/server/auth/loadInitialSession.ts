import { cache } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/integrations/supabase/server";

export const loadInitialSession = cache(async (): Promise<Session | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session;
  } catch (error) {
    console.error("Failed to load initial auth session:", error);
    return null;
  }
});
