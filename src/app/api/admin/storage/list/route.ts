import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type StorageFileItem = {
  name: string;
  path: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

const MEDIA_BUCKET = "media";
const CMS_MEDIA_PREFIXES = ["cms", "logos"] as const;
const LIST_LIMIT = 1000;

function normalizePrefix(prefix: string) {
  return prefix.trim().replace(/^\/+|\/+$/g, "");
}

async function listFolder(
  prefix: string,
  canManageAllMedia: boolean,
): Promise<StorageFileItem[]> {
  const supabase = getSupabaseAdmin();
  const normalizedPrefix = normalizePrefix(prefix);

  if (
    !canManageAllMedia &&
    normalizedPrefix.length > 0 &&
    !CMS_MEDIA_PREFIXES.some(
      (allowedPrefix) =>
        normalizedPrefix === allowedPrefix ||
        normalizedPrefix.startsWith(`${allowedPrefix}/`),
    )
  ) {
    return [];
  }

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .list(normalizedPrefix || undefined, {
      limit: LIST_LIMIT,
      sortBy: { column: "updated_at", order: "desc" },
    });

  if (error) {
    if (error.message?.toLowerCase().includes("not found")) {
      return [];
    }

    throw error;
  }

  const entries = data ?? [];
  const filesInFolder: StorageFileItem[] = [];
  const nestedFolders: string[] = [];

  for (const entry of entries) {
    const fullPath = normalizedPrefix
      ? `${normalizedPrefix}/${entry.name}`
      : entry.name;

    if (entry.id) {
      filesInFolder.push({ ...entry, path: fullPath });
    } else {
      nestedFolders.push(fullPath);
    }
  }

  if (nestedFolders.length > 0) {
    const nestedResults = await Promise.all(
      nestedFolders.map((folder) => listFolder(folder, canManageAllMedia)),
    );

    for (const nestedFiles of nestedResults) {
      filesInFolder.push(...nestedFiles);
    }
  }

  return filesInFolder;
}

export async function GET(req: NextRequest) {
  const context = await requirePermission("cms.media");
  const canManageAllMedia = context.hasPermission("admin.access");
  const requestedPrefix = req.nextUrl.searchParams.get("prefix");

  const prefixes =
    requestedPrefix && requestedPrefix.trim().length > 0
      ? [requestedPrefix]
      : canManageAllMedia
        ? [""]
        : [...CMS_MEDIA_PREFIXES];

  try {
    const filesByPrefix = await Promise.all(
      prefixes.map((prefix) => listFolder(prefix, canManageAllMedia)),
    );
    const files = filesByPrefix.flat();

    return NextResponse.json({ data: files }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to load media assets from storage.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
