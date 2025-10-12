"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";

type FileItem = {
  name: string;
  id?: string;
  updated_at?: string;
  created_at?: string;
  metadata?: Record<string, unknown> | null;
};

export default function CmsMediaPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from("cms-assets").list("", {
      limit: 100,
      sortBy: { column: "updated_at", order: "desc" },
    });
    setLoading(false);
    if (!error) setFiles(data ?? []);
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
      const res = await fetch("/api/cms/upload", { method: "POST", body: form });
      if (res.ok) {
        await load();
      }
    } finally {
      setUploading(false);
      ev.target.value = "";
    }
  };

  const onDelete = async (name: string) => {
    const confirmed = confirm(`Delete ${name}?`);
    if (!confirmed) return;
    await supabase.storage.from("cms-assets").remove([name]);
    await load();
  };

  const publicUrlFor = (name: string) => supabase.storage.from("cms-assets").getPublicUrl(name).data.publicUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Media</h1>
        <div className="flex items-center gap-3">
          <input type="file" accept="image/*,video/*" onChange={onUpload} disabled={uploading} />
          <Button variant="secondary" onClick={load} disabled={loading}>Refresh</Button>
        </div>
      </div>

      {loading ? <div>Loading…</div> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((f) => {
          const url = publicUrlFor(f.name);
          const isImage = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.name);
          return (
            <Card key={f.name} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="truncate text-base" title={f.name}>{f.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt={f.name} className="w-full h-40 object-cover rounded" />
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">{f.name.split(".").pop()?.toUpperCase()} file</div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between gap-2">
                <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(url)}>Copy URL</Button>
                <a href={url} target="_blank" rel="noreferrer">
                  <Button size="sm" variant="secondary">Open</Button>
                </a>
                <Button size="sm" variant="destructive" onClick={() => onDelete(f.name)}>Delete</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}


