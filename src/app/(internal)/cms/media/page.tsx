"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Copy,
  ExternalLink,
  File,
  FileImage,
  Film,
  Loader2,
  RefreshCcw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WorkspaceDataTableShell,
  WorkspaceEmptyState,
  WorkspaceMetricCard,
  WorkspacePageHeader,
} from "@/components/workspaces/WorkspacePrimitives";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  buildCmsMediaStoragePath,
  CMS_MEDIA_UPLOAD_ERROR_MESSAGES,
  isAllowedCmsMediaMimeType,
  isAllowedCmsMediaUploadSize,
} from "@/lib/cms/mediaUpload";

type FileItem = {
  name: string;
  path: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

type MediaFilter = "all" | "image" | "video" | "file";

const MEDIA_BUCKET = "media";
const MEDIA_PREFIX = "";
const LIST_LIMIT = 1000;
const INITIAL_VISIBLE_ASSET_COUNT = 24;

const MEDIA_FILTERS: Array<{ value: MediaFilter; label: string }> = [
  { value: "all", label: "All assets" },
  { value: "image", label: "Images" },
  { value: "video", label: "Videos" },
  { value: "file", label: "Other files" },
];

const IMAGE_ASSET_PATTERN = /\.(png|jpe?g|webp|gif|svg|avif)$/i;
const VIDEO_ASSET_PATTERN = /\.(mp4|mov|webm|m4v|avi|mkv)$/i;

const getAssetKind = (name: string): Exclude<MediaFilter, "all"> => {
  if (IMAGE_ASSET_PATTERN.test(name)) {
    return "image";
  }

  if (VIDEO_ASSET_PATTERN.test(name)) {
    return "video";
  }

  return "file";
};

const getAssetKindLabel = (kind: Exclude<MediaFilter, "all">) => {
  if (kind === "image") return "Image";
  if (kind === "video") return "Video";
  return "File";
};

const getAssetTimestamp = (file: FileItem) =>
  file.updated_at ?? file.created_at;

const getAssetSize = (file: FileItem) => {
  const value = file.metadata?.size;
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const formatBytes = (bytes: number | null) => {
  if (bytes === null || bytes <= 0) {
    return "Unknown";
  }

  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

export default function CmsMediaPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [assetFilter, setAssetFilter] = useState<MediaFilter>("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_ASSET_COUNT);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const listFolder = async (prefix: string): Promise<FileItem[]> => {
        const listPath = prefix || undefined;
        const { data, error } = await supabase.storage
          .from(MEDIA_BUCKET)
          .list(listPath, {
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
        const filesInFolder: FileItem[] = [];
        const nestedFolders: string[] = [];

        for (const entry of entries) {
          const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.id) {
            filesInFolder.push({ ...entry, path: fullPath });
          } else {
            nestedFolders.push(fullPath);
          }
        }

        if (nestedFolders.length) {
          const nested = await Promise.all(
            nestedFolders.map((folder) => listFolder(folder)),
          );

          for (const sub of nested) {
            filesInFolder.push(...sub);
          }
        }

        return filesInFolder;
      };

      const allFiles = await listFolder(MEDIA_PREFIX);
      const sorted = allFiles.sort((a, b) => {
        const dateA = new Date(getAssetTimestamp(a) ?? 0).getTime();
        const dateB = new Date(getAssetTimestamp(b) ?? 0).getTime();
        return dateB - dateA;
      });

      setFiles(sorted);
    } catch (error) {
      console.error("Failed to load media assets", error);
      setFiles([]);
      setLoadError("Could not load CMS media assets. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_ASSET_COUNT);
  }, [assetFilter, searchTerm, files.length]);

  const ensureSession = async (): Promise<Session> => {
    let {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) return session;

    const { data, error } = await supabase.auth.refreshSession();
    if (error || !data.session) {
      throw new Error("Please sign in again to upload media.");
    }

    return data.session;
  };

  const onUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      await ensureSession();

      if (!isAllowedCmsMediaMimeType(file.type)) {
        throw new Error(CMS_MEDIA_UPLOAD_ERROR_MESSAGES.invalidType);
      }

      if (!isAllowedCmsMediaUploadSize(file.size)) {
        throw new Error(CMS_MEDIA_UPLOAD_ERROR_MESSAGES.tooLarge);
      }

      const originalFileName =
        file.name.split("/").pop()?.split("\\").pop()?.trim() ?? "";
      if (!originalFileName) {
        throw new Error(CMS_MEDIA_UPLOAD_ERROR_MESSAGES.invalidName);
      }

      const storagePath = buildCmsMediaStoragePath(originalFileName);
      const { error } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: "Asset uploaded",
        description: `${originalFileName} is now available in the media library.`,
      });
      await load();
    } catch (error) {
      console.error("Failed to upload media asset", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while uploading the file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const onDelete = async (path: string) => {
    const confirmed = confirm(`Delete ${path}?`);
    if (!confirmed) return;

    try {
      await adminFetch<{ success: boolean }>("/api/admin/storage/delete", {
        method: "POST",
        body: JSON.stringify({ bucket: MEDIA_BUCKET, path }),
      });
      toast({
        title: "Asset deleted",
        description: `${path} was removed from the media library.`,
      });
      await load();
    } catch (error) {
      console.error("Failed to delete media asset", error);
      toast({
        title: "Delete failed",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while deleting the file.",
        variant: "destructive",
      });
    }
  };

  const handleCopyUrl = async (path: string) => {
    const url = publicUrlFor(path);

    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "URL copied",
        description: `Copied the public URL for ${path}.`,
      });
    } catch (error) {
      console.error("Failed to copy media URL", error);
      toast({
        title: "Copy failed",
        description: "Unable to copy the asset URL.",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    const imageCount = files.filter(
      (file) => getAssetKind(file.name) === "image",
    ).length;
    const videoCount = files.filter(
      (file) => getAssetKind(file.name) === "video",
    ).length;
    const otherCount = files.length - imageCount - videoCount;

    return {
      total: files.length,
      images: imageCount,
      videos: videoCount,
      other: otherCount,
    };
  }, [files]);

  const filteredFiles = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return files.filter((file) => {
      const kind = getAssetKind(file.name);
      const matchesFilter = assetFilter === "all" ? true : kind === assetFilter;
      if (!matchesFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      return (
        file.name.toLowerCase().includes(normalizedQuery) ||
        file.path.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [assetFilter, files, searchTerm]);

  const visibleFiles = filteredFiles.slice(0, visibleCount);
  const remainingFilesCount = Math.max(
    filteredFiles.length - visibleFiles.length,
    0,
  );

  return (
    <div className="space-y-8">
      <WorkspacePageHeader
        breadcrumb="CMS"
        title="Media Library"
        subtitle="Upload brand assets, browse the latest files, and reuse media across pages without digging through raw storage paths."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={onUpload}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => load()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Upload asset"}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <WorkspaceMetricCard
          label="Total assets"
          value={stats.total}
          trend={`${filteredFiles.length} visible`}
          helperText="All uploaded CMS assets in this bucket."
          icon={File}
        />
        <WorkspaceMetricCard
          label="Images"
          value={stats.images}
          trend="Editorial imagery"
          helperText="Photos, illustrations, logos, and thumbnails."
          icon={FileImage}
          emphasisTone="success"
        />
        <WorkspaceMetricCard
          label="Videos"
          value={stats.videos}
          trend="Motion assets"
          helperText="Clips and motion content ready for landing pages."
          icon={Film}
          emphasisTone="warning"
        />
        <WorkspaceMetricCard
          label="Other files"
          value={stats.other}
          trend="Documents or misc"
          helperText="Everything outside image and video formats."
          icon={File}
        />
      </div>

      <WorkspaceDataTableShell
        title="Asset library"
        description="Search recent uploads, filter by asset type, and copy reusable public URLs without opening every file."
        controls={
          <>
            <div className="relative w-full max-w-lg">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by file name or storage path"
                className="pl-9"
              />
            </div>
            <Tabs
              value={assetFilter}
              onValueChange={(value) => setAssetFilter(value as MediaFilter)}
            >
              <TabsList className="rounded-full bg-muted/40 p-1">
                {MEDIA_FILTERS.map((filter) => (
                  <TabsTrigger
                    key={filter.value}
                    value={filter.value}
                    className="rounded-full px-4 py-1 text-sm"
                  >
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        }
        isEmpty={!loading && !loadError && filteredFiles.length === 0}
        emptyState={
          <WorkspaceEmptyState
            title="No assets match this view"
            description="Upload a new asset or clear your search and filter selections to see more media."
            icon={<FileImage className="h-5 w-5" />}
            action={
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setAssetFilter("all");
                  }}
                >
                  Clear filters
                </Button>
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Upload asset
                </Button>
              </>
            }
          />
        }
        footerActions={
          remainingFilesCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setVisibleCount(
                  (current) => current + INITIAL_VISIBLE_ASSET_COUNT,
                )
              }
            >
              Show {Math.min(remainingFilesCount, INITIAL_VISIBLE_ASSET_COUNT)}{" "}
              more
            </Button>
          ) : null
        }
      >
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 9 }).map((_, index) => (
              <Skeleton key={index} className="h-[20rem] rounded-[1.25rem]" />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6 text-destructive">
            {loadError}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleFiles.map((file) => {
              const url = publicUrlFor(file.path);
              const assetKind = getAssetKind(file.name);
              const assetTimestamp = getAssetTimestamp(file);
              const isImage = assetKind === "image";

              return (
                <Card
                  key={file.path}
                  className="flex h-full flex-col overflow-hidden border border-border/60 shadow-sm"
                >
                  <CardHeader className="gap-3 border-b border-border/60 bg-transparent pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <CardTitle
                          className="truncate text-base"
                          title={file.name}
                        >
                          {file.name}
                        </CardTitle>
                        <p
                          className="truncate text-xs text-muted-foreground"
                          title={file.path}
                        >
                          {file.path}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {getAssetKindLabel(assetKind)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4 pt-4">
                    <div className="overflow-hidden rounded-[1rem] border border-border/60 bg-background/40">
                      {isImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={url}
                          alt={file.name}
                          className="aspect-[4/3] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[4/3] items-center justify-center bg-muted/20">
                          <div className="flex flex-col items-center gap-3 text-center">
                            {assetKind === "video" ? (
                              <Film className="h-8 w-8 text-muted-foreground" />
                            ) : (
                              <File className="h-8 w-8 text-muted-foreground" />
                            )}
                            <p className="text-sm font-medium text-foreground">
                              {getAssetKindLabel(assetKind)} asset
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-auto grid gap-3 sm:grid-cols-2">
                      <AssetMetaItem
                        label="Updated"
                        value={
                          assetTimestamp
                            ? formatDistanceToNow(new Date(assetTimestamp), {
                                addSuffix: true,
                              })
                            : "Unknown"
                        }
                      />
                      <AssetMetaItem
                        label="Size"
                        value={formatBytes(getAssetSize(file))}
                      />
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2 border-t border-border/60 bg-transparent pt-4">
                    <div className="grid w-full grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full rounded-lg"
                        onClick={() => handleCopyUrl(file.path)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-lg"
                        asChild
                      >
                        <a href={url} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open
                        </a>
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full rounded-lg"
                      onClick={() => onDelete(file.path)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete asset
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </WorkspaceDataTableShell>
    </div>
  );
}

function AssetMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.95rem] border border-border/60 bg-background/40 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function publicUrlFor(path: string) {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}
