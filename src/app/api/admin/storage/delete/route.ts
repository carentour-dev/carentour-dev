import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type DeletePayload = {
  bucket?: unknown;
  path?: unknown;
};

const MEDIA_BUCKET = "media";
const CMS_MEDIA_PREFIXES = ["cms/", "logos/"] as const;

function normalizeStoragePath(path: string) {
  return path.trim().replace(/^\/+/, "");
}

function isAllowedCmsMediaPath(path: string) {
  return CMS_MEDIA_PREFIXES.some((prefix) => path.startsWith(prefix));
}

export async function POST(req: NextRequest) {
  const context = await requirePermission("cms.media");

  const json = (await req.json().catch(() => null)) as DeletePayload | null;

  if (
    !json ||
    typeof json.bucket !== "string" ||
    typeof json.path !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid payload. Provide both bucket and path." },
      { status: 400 },
    );
  }

  if (json.bucket !== MEDIA_BUCKET) {
    return NextResponse.json(
      { error: "Only CMS media files can be deleted from this route." },
      { status: 403 },
    );
  }

  const normalizedPath = normalizeStoragePath(json.path);
  const canManageAllMedia = context.hasPermission("admin.access");

  if (
    normalizedPath.length === 0 ||
    normalizedPath.includes("..") ||
    (!canManageAllMedia && !isAllowedCmsMediaPath(normalizedPath))
  ) {
    return NextResponse.json(
      { error: "Only allowed CMS media files can be deleted from this route." },
      { status: 403 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .remove([normalizedPath]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
