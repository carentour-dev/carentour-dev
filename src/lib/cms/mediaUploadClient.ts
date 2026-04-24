"use client";

import { adminFetch } from "@/components/admin/hooks/useAdminFetch";

export type CmsMediaUploadResult = {
  publicUrl: string;
  path: string;
  originalPath: string;
  optimizedPath: string;
  optimized: boolean;
  width: number | null;
  height: number | null;
  originalByteSize: number;
  optimizedByteSize: number;
  mimeType: string;
  optimizedMimeType: string;
};

export async function uploadCmsMediaViaApi({
  file,
  bucket,
  folder,
}: {
  file: File;
  bucket: string;
  folder: string;
}) {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("bucket", bucket);
  formData.set("folder", folder);

  return adminFetch<CmsMediaUploadResult>("/api/admin/storage/upload", {
    method: "POST",
    body: formData,
  });
}
