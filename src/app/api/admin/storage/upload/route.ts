import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { buildCmsProcessedUpload } from "@/server/cms/imageProcessing";
import {
  CMS_MEDIA_UPLOAD_ERROR_MESSAGES,
  isAllowedCmsMediaMimeType,
  isAllowedCmsMediaUploadSize,
} from "@/lib/cms/mediaUpload";

const MEDIA_BUCKET = "media";

function getStringFormValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

function getPublicUrl(path: string) {
  return getSupabaseAdmin().storage.from(MEDIA_BUCKET).getPublicUrl(path).data
    .publicUrl;
}

export async function POST(req: NextRequest) {
  await requirePermission("cms.media");

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const bucket = getStringFormValue(formData, "bucket") ?? MEDIA_BUCKET;
    const folder = getStringFormValue(formData, "folder") ?? "cms";

    if (bucket !== MEDIA_BUCKET) {
      return NextResponse.json(
        { error: "Only CMS media uploads are supported by this route." },
        { status: 403 },
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a valid media file." },
        { status: 400 },
      );
    }

    const mimeType = file.type || "application/octet-stream";
    if (!isAllowedCmsMediaMimeType(mimeType)) {
      return NextResponse.json(
        { error: CMS_MEDIA_UPLOAD_ERROR_MESSAGES.invalidType },
        { status: 400 },
      );
    }

    if (!isAllowedCmsMediaUploadSize(file.size)) {
      return NextResponse.json(
        { error: CMS_MEDIA_UPLOAD_ERROR_MESSAGES.tooLarge },
        { status: 400 },
      );
    }

    const originalFileName = file.name.trim();
    if (!originalFileName) {
      return NextResponse.json(
        { error: CMS_MEDIA_UPLOAD_ERROR_MESSAGES.invalidName },
        { status: 400 },
      );
    }

    const input = Buffer.from(await file.arrayBuffer());
    const processed = await buildCmsProcessedUpload({
      file: input,
      fileName: originalFileName,
      mimeType,
      folder,
    });
    const supabase = getSupabaseAdmin();

    if (processed.optimized) {
      const originalResult = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(processed.originalPath, processed.originalBuffer, {
          contentType: processed.mimeType,
          upsert: false,
        });

      if (originalResult.error) {
        throw originalResult.error;
      }
    }

    const optimizedResult = await supabase.storage
      .from(MEDIA_BUCKET)
      .upload(processed.optimizedPath, processed.optimizedBuffer, {
        contentType: processed.optimizedMimeType,
        upsert: false,
      });

    if (optimizedResult.error) {
      if (processed.optimized) {
        await supabase.storage
          .from(MEDIA_BUCKET)
          .remove([processed.originalPath])
          .catch(() => undefined);
      }
      throw optimizedResult.error;
    }

    return NextResponse.json(
      {
        data: {
          publicUrl: getPublicUrl(processed.publicPath),
          path: processed.publicPath,
          originalPath: processed.originalPath,
          optimizedPath: processed.optimizedPath,
          optimized: processed.optimized,
          width: processed.width,
          height: processed.height,
          originalByteSize: processed.originalByteSize,
          optimizedByteSize: processed.optimizedByteSize,
          mimeType: processed.mimeType,
          optimizedMimeType: processed.optimizedMimeType,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload media asset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
