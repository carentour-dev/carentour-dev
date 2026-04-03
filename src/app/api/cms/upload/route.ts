import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/ogg",
]);

function buildSafeStorageName(originalFileName: string) {
  const trimmed = originalFileName.trim();
  const extensionIndex = trimmed.lastIndexOf(".");
  const rawBaseName =
    extensionIndex > 0 ? trimmed.slice(0, extensionIndex) : trimmed;
  const rawExtension =
    extensionIndex > 0 ? trimmed.slice(extensionIndex).toLowerCase() : "";
  const safeBaseName = rawBaseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const safeExtension = rawExtension.replace(/[^.a-z0-9]/g, "").slice(0, 16);
  const normalizedBaseName = safeBaseName.length > 0 ? safeBaseName : "upload";

  return `${crypto.randomUUID()}-${normalizedBaseName}${safeExtension}`;
}

export async function POST(req: NextRequest) {
  await requirePermission("cms.media");

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json(
      {
        error:
          "Unsupported file type. Upload a JPG, PNG, WEBP, GIF, AVIF, MP4, WEBM, MOV, or OGG file.",
      },
      { status: 415 },
    );
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json(
      { error: "File is too large. Maximum size is 25MB." },
      { status: 413 },
    );
  }

  const originalFileName =
    file.name.split("/").pop()?.split("\\").pop() ?? file.name;
  if (!originalFileName) {
    return NextResponse.json(
      { error: "file name is invalid" },
      { status: 400 },
    );
  }
  const storagePath = `cms/${buildSafeStorageName(originalFileName)}`;

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase.storage
    .from("media")
    .upload(storagePath, file, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from("media")
    .getPublicUrl(data.path);
  return NextResponse.json(
    { url: publicUrl.publicUrl, path: data.path },
    { status: 201 },
  );
}
