"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Loader2, UploadCloud, X } from "lucide-react";

type ImageUploaderProps = {
  label: string;
  description?: string;
  value?: string | null;
  onChange: (value: string | null) => void;
  bucket?: string;
  folder?: string;
  accept?: string;
  className?: string;
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
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Upload the selected file to Supabase Storage and surface a public URL.
  const uploadFile = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const extension = file.name.split(".").pop();
      const fileName = `${folder}/${crypto.randomUUID()}.${extension}`;
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, { upsert: false });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      onChange(publicUrl);
    } catch (err) {
      console.error(err);
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      <div className="flex flex-col gap-3 rounded-lg border border-dashed border-muted-foreground/40 bg-muted/40 p-4">
        {value ? (
          <div className="relative h-40 w-full overflow-hidden rounded-md bg-background ring-1 ring-border">
            <Image src={value} alt="Uploaded preview" fill className="object-cover" />
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 h-8 w-8 rounded-full shadow"
              onClick={() => onChange(null)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-md border border-dashed border-muted-foreground/60 bg-background text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UploadCloud className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Drag & drop or click to upload</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
            </div>
          </div>
        )}

        <Input
          type="file"
          accept={accept}
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void uploadFile(file);
            }
          }}
        />
      </div>
      {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
