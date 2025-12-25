import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { ApiError } from "@/server/utils/errors";

const ADMIN_PERMISSIONS = {
  allPermissions: ["operations.shared", "operations.requests"],
} as const;

const BUCKET_ID = "patient-documents";
const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour

const querySchema = z.object({
  bucket: z.literal(BUCKET_ID),
  path: z.string().min(1, "path is required"),
});

const isTruthy = (value: string | null) => {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
};

export const GET = adminRoute(async (req) => {
  const { searchParams } = new URL(req.url);

  const parsed = querySchema.parse({
    bucket: searchParams.get("bucket"),
    path: searchParams.get("path"),
  });

  const shouldDownload = isTruthy(searchParams.get("download"));

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(parsed.bucket)
    .createSignedUrl(
      parsed.path,
      DEFAULT_EXPIRY_SECONDS,
      shouldDownload ? { download: true } : undefined,
    );

  if (error || !data?.signedUrl) {
    throw new ApiError(
      500,
      "Failed to generate document link",
      error?.message ?? error ?? undefined,
    );
  }

  return jsonResponse({
    url: data.signedUrl,
    expiresIn: DEFAULT_EXPIRY_SECONDS,
    download: shouldDownload,
  });
}, ADMIN_PERMISSIONS);
