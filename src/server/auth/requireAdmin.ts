import { NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

export async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization");

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
