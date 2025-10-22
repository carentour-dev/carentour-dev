"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { adminFetch } from "@/components/admin/hooks/useAdminFetch";
import { cn } from "@/lib/utils";
import { FileText, Loader2, UploadCloud, X } from "lucide-react";

type ImageUploaderProps = {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
  className?: string;
  mode?: "image" | "file";
  emptyStateTitle?: string;
  emptyStateDescription?: string;
};

export function ImageUploader({
  label,
  description,
  value,
  onChange,
  bucket = "media",
  folder = "admin",
  accept = "image/*",
  className,
  mode = "image",
  emptyStateTitle = "Drag & drop or click to upload",
  emptyStateDescription = "PNG, JPG up to 5MB",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractStoragePath = (url: string | null) => {
    if (!url) return null;
    try {
      const parsed = new URL(url);
      const prefix = `/storage/v1/object/public/${bucket}/`;
      if (!parsed.pathname.startsWith(prefix)) {
        return null;
      }
      const relativePath = parsed.pathname.slice(prefix.length);
      return decodeURIComponent(relativePath);
    } catch {
      return null;
    }
  };

  const deleteFromStorage = async (
    url: string | null,
    { suppressError = false }: { suppressError?: boolean } = {},
  ) => {
    const path = extractStoragePath(url);
    if (!path) return true;
    try {
      await adminFetch<{ success: boolean }>("/api/admin/storage/delete", {
        method: "POST",
        body: JSON.stringify({ bucket, path }),
      });
      return true;
    } catch (err) {
      console.error("Error deleting storage object:", err);
      if (!suppressError) {
        setError("Failed to delete the file. Please try again.");
      }
      return false;
    }
  };

  const handleRemove = async () => {
    if (!value) {
      onChange(null);
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const deleted = await deleteFromStorage(value);
      if (deleted) {
        onChange(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  // Upload the selected file to Supabase Storage and surface a public URL.
  const uploadFile = async (file: File) => {
    if (uploading || deleting) return;
    setError(null);
    setUploading(true);
    const previousValue = value ?? null;

    const isStorageConflictError = (
      error: unknown,
    ): error is { status?: number; statusCode?: string } => {
      if (typeof error !== "object" || error === null) {
        return false;
      }

      const status = (error as { status?: unknown }).status;
      if (typeof status === "number" && status === 409) {
        return true;
      }

      const statusCode = (error as { statusCode?: unknown }).statusCode;
      return typeof statusCode === "string" && statusCode === "409";
    };

    try {
      const originalName = (() => {
        const candidate = file.name.split(/[/\\]/).pop()?.trim() ?? "";
        if (candidate.length > 0) {
          return candidate;
        }
        const inferredExtension =
          file.type && file.type.includes("/")
            ? `.${file.type.split("/").pop() ?? ""}`
            : "";
        return `file-${Date.now()}${inferredExtension}`;
      })();
      const randomSegment =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2, 10);
      const folderPrefix = folder ? `${folder}/` : "";
      const fileName = `${folderPrefix}${randomSegment}/${originalName}`;
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) {
        if (isStorageConflictError(uploadError)) {
          setError(
            "A file with this name already exists. Rename the file and try again.",
          );
          return;
        }
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onChange(publicUrl);
      if (previousValue) {
        void deleteFromStorage(previousValue, { suppressError: true });
      }
    } catch (err) {
      console.error(err);
      setError("File upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4">
        {value ? (
          mode === "image" ? (
            <div className="relative h-40 w-full overflow-hidden rounded-md bg-background ring-1 ring-border">
              <Image
                src={value}
                alt="Uploaded preview"
                fill
                className="object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-8 w-8 rounded-full shadow"
                onClick={() => {
                  void handleRemove();
                }}
                type="button"
                disabled={uploading || deleting}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-background p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-sm font-medium text-foreground">
                    Uploaded file
                  </p>
                  <a
                    href={value}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    View document
                  </a>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  void handleRemove();
                }}
                type="button"
                disabled={uploading || deleting}
              >
                Remove
              </Button>
            </div>
          )
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/60 bg-background text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {uploading || deleting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <UploadCloud className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                {emptyStateTitle}
              </p>
              <p className="text-xs text-muted-foreground">
                {emptyStateDescription}
              </p>
            </div>
          </div>
        )}

        <Input
          type="file"
          accept={accept}
          disabled={uploading || deleting}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadFile(file);
            }
          }}
        />
      </div>
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
