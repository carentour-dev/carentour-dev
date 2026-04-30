import { randomUUID } from "crypto";
import { z } from "zod";
import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { ApiError } from "@/server/utils/errors";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const BUCKET_ID = "patient-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

const PATIENT_DOCUMENTS_PERMISSIONS = {
  allPermissions: ["operations.shared"],
  anyPermissions: [
    "operations.patient_documents.manage",
    "operations.patients",
  ],
} as const;

const documentTypeSchema = z
  .enum(["passport", "medical_records", "insurance", "other"])
  .default("other");

const visibilitySchema = z
  .enum(["patient_visible", "internal"])
  .default("patient_visible");

const patientIdSchema = z.string().uuid();

const sanitizeFileName = (name: string) => {
  const trimmed = name.split(/[/\\]/).pop()?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : "document";
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const deriveExtension = (filename: string, mimeType: string) => {
  const match = filename.match(/\.([a-zA-Z0-9]+)$/);
  if (match) {
    return match[1].toLowerCase();
  }
  if (mimeType.includes("/")) {
    return mimeType.split("/").pop() ?? "";
  }
  return "";
};

export const runtime = "nodejs";

export const POST = adminRoute(async (req, ctx) => {
  if (!ctx.auth?.profileId) {
    throw new ApiError(403, "A staff profile is required to upload documents");
  }

  const formData = await req.formData();
  const file = formData.get("file");
  const patientId = patientIdSchema.parse(formData.get("patientId"));
  const documentType = documentTypeSchema.parse(
    formData.get("documentType") ?? "other",
  );
  const visibility = visibilitySchema.parse(
    formData.get("visibility") ?? "patient_visible",
  );

  if (!(file instanceof File)) {
    throw new ApiError(400, "file is required");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new ApiError(
      400,
      "Unsupported file type. Upload PDF, JPG, or PNG files.",
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ApiError(
      400,
      "File exceeds 10MB limit. Please compress and try again.",
    );
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: patient, error: patientError } = await supabaseAdmin
    .from("patients")
    .select("id")
    .eq("id", patientId)
    .maybeSingle();

  if (patientError) {
    throw new ApiError(
      500,
      "Failed to verify patient record",
      patientError.message,
    );
  }

  if (!patient?.id) {
    throw new ApiError(404, "Patient not found");
  }

  const originalName = sanitizeFileName(file.name || file.type || "document");
  const extension = deriveExtension(originalName, file.type);
  const baseName = originalName.replace(/\.[^/.]+$/, "");
  const storedFileName = `${randomUUID()}-${slugify(baseName) || "document"}${
    extension ? `.${extension}` : ""
  }`;
  const storagePath = `patients/${patient.id}/documents/${storedFileName}`;

  const arrayBuffer = await file.arrayBuffer();
  const uploadResult = await supabaseAdmin.storage
    .from(BUCKET_ID)
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadResult.error) {
    throw new ApiError(
      500,
      "Failed to persist document",
      uploadResult.error.message,
    );
  }

  const record = {
    label: originalName,
    type: documentType,
    bucket: BUCKET_ID,
    path: uploadResult.data.path,
    size: file.size,
    uploaded_at: new Date().toISOString(),
    patient_id: patient.id,
    created_by_profile_id: ctx.auth.profileId,
    source: "staff",
    visibility,
    metadata: {
      uploadedByUserId: ctx.auth.user.id,
      uploadedByRole: ctx.auth.primaryRole,
      uploadedVia: "admin_patient_documents",
      originalName,
    },
  };

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("patient_documents")
    .insert(record)
    .select(
      `
        id,
        label,
        type,
        bucket,
        path,
        size,
        source,
        visibility,
        uploaded_at,
        created_at,
        request_id,
        metadata,
        created_by_profile:profiles!patient_documents_created_by_profile_id_fkey(
          id,
          username,
          email,
          avatar_url,
          phone,
          job_title
        )
      `,
    )
    .maybeSingle();

  if (insertError || !inserted) {
    await supabaseAdmin.storage.from(BUCKET_ID).remove([storagePath]);
    throw new ApiError(500, "Failed to record document", insertError?.message);
  }

  return jsonResponse(inserted, 201);
}, PATIENT_DOCUMENTS_PERMISSIONS);
