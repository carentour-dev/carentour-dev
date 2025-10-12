import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

export async function requireAdmin() {
  const authHeader = (await headers()).get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const accessToken = authHeader.slice(7).trim();

  if (!accessToken) {
    throw new ApiError(401, "Missing access token");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new ApiError(401, "Invalid or expired token", userError?.message);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, "Failed to load user profile", profileError.message);
  }

  if (!profile || profile.role !== "admin") {
    throw new ApiError(403, "Admin privileges required");
  }

  return { user: userData.user, role: profile.role };
}

// New helper that authorizes any of the allowed roles
export async function requireRole(allowed: Array<"admin" | "editor" | "user">) {
  const authHeader = (await headers()).get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ApiError(401, "Missing or invalid Authorization header");
  }

  const accessToken = authHeader.slice(7).trim();

  if (!accessToken) {
    throw new ApiError(401, "Missing access token");
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !userData.user) {
    throw new ApiError(401, "Invalid or expired token", userError?.message);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiError(500, "Failed to load user profile", profileError.message);
  }

  if (!profile || !allowed.includes(profile.role as any)) {
    throw new ApiError(403, "Insufficient privileges");
  }

  return { user: userData.user, role: profile.role };
}
