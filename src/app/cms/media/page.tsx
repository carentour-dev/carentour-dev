"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";

type FileItem = {
  name: string;
  path: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

const MEDIA_BUCKET = "media";
const MEDIA_PREFIX = "";
const LIST_LIMIT = 1000;

export default function CmsMediaPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
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
          // Treat missing folders as empty to avoid breaking the library view.
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
        const dateA = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
        const dateB = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
        return dateB - dateA;
      });
      setFiles(sorted);
    } catch (error) {
      console.error("Failed to load media assets", error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onUpload = async (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/cms/upload", {
        method: "POST",
        body: form,
      });
      if (res.ok) {
        await load();
      }
    } finally {
      setUploading(false);
      ev.target.value = "";
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
      await load();
    } catch (error) {
      console.error("Failed to delete media asset", error);
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the file.";
      alert(message);
    }
  };

  const publicUrlFor = (path: string) =>
    supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Media</h1>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*,video/*"
            onChange={onUpload}
            disabled={uploading}
          />
          <Button variant="secondary" onClick={load} disabled={loading}>
            Refresh
          </Button>
        </div>
      </div>

      {loading ? <div>Loading…</div> : null}

      {!loading && files.length === 0 ? (
        <div>No media uploaded yet.</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((f) => {
          const url = publicUrlFor(f.path);
          const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name);
          return (
            <Card key={f.path} className="overflow-hidden">
              <CardHeader>
                <div className="space-y-1">
                  <CardTitle className="truncate text-base" title={f.path}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline"
                    >
                      {f.name}
                    </a>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground break-all">
                    {f.path}
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt={f.name}
                    className="w-full h-40 object-cover rounded"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                    {f.name.split(".").pop()?.toUpperCase()} file
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(url)}
                >
                  Copy URL
                </Button>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </a>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => onDelete(f.path)}
                >
                  Delete
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
