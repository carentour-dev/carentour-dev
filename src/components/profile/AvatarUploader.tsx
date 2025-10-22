"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2, UploadCloud, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type AvatarUploaderProps = {
  label?: string;
  description?: string;
  value: string | null;
  onChange: (value: string | null) => void;
  disabled?: boolean;
  userId: string | null | undefined;
  bucket?: string;
  folder?: string;
};

const DEFAULT_BUCKET = "media";
const DEFAULT_FOLDER = "staff";

export function AvatarUploader({
  label = "Avatar",
  description = "PNG or JPG up to 5MB",
  value,
  onChange,
  disabled = false,
  userId,
  bucket = DEFAULT_BUCKET,
  folder = DEFAULT_FOLDER,
}: AvatarUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractStoragePath = useCallback(
    (url: string | null) => {
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
    },
    [bucket],
  );

  const deleteFromStorage = useCallback(
    async (url: string | null) => {
      const path = extractStoragePath(url);
      if (!path) {
        return true;
      }
      try {
        const { error: removeError } = await supabase.storage
          .from(bucket)
          .remove([path]);

        if (removeError) {
          console.error("Failed to delete previous avatar:", removeError);
          return false;
        }
        return true;
      } catch (err) {
        console.error("Unexpected error deleting avatar:", err);
        return false;
      }
    },
    [bucket, extractStoragePath],
  );

  const resolvedFolder = useMemo(() => {
    const cleanedFolder = folder?.trim().replace(/\/+$/, "") ?? DEFAULT_FOLDER;
    if (!userId) {
      return cleanedFolder;
    }
    return `${cleanedFolder}/${userId}`;
  }, [folder, userId]);

  const handleFileSelection = async (file: File | null) => {
    if (!file || uploading || deleting || disabled) {
      return;
    }

    setError(null);
    setUploading(true);
    const previousValue = value ?? null;

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

    const folderPrefix = resolvedFolder.length ? `${resolvedFolder}/` : "";
    const storagePath = `${folderPrefix}${randomSegment}/${originalName}`;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: false });

      if (uploadError) {
        if (uploadError.status === 409 || uploadError.statusCode === "409") {
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
        void deleteFromStorage(previousValue);
      }
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setError("Avatar upload failed. Please try again.");
    } finally {
      setUploading(false);
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
      } else {
        setError("Failed to remove the avatar. Please try again.");
      }
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4">
        {value ? (
          <div className="relative h-32 w-32 self-start overflow-hidden rounded-full bg-background ring-1 ring-border">
            <Image
              src={value}
              alt="Avatar preview"
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full shadow"
              onClick={() => {
                void handleRemove();
              }}
              disabled={uploading || deleting || disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <label
            className={cn(
              "flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-border/60 bg-background px-6 py-10 text-center transition hover:border-foreground/30 focus-within:border-primary",
              disabled ? "pointer-events-none opacity-70" : "",
            )}
          >
            <UploadCloud className="h-6 w-6 text-muted-foreground" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
            <Input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uploading || deleting || disabled || !userId}
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                void handleFileSelection(file);
              }}
            />
          </label>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {uploading
              ? "Uploading avatar…"
              : deleting
                ? "Removing avatar…"
                : "Recommended size: 320×320px"}
          </span>
          {(uploading || deleting) && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!userId ? (
          <p className="text-xs text-muted-foreground">
            Avatar uploads unlock once your session finishes loading.
          </p>
        ) : null}
      </div>
    </div>
  );
}
