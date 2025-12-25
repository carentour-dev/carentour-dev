import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { z } from "zod";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";

const BUCKET_ID = "patient-documents";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
]);

const documentTypeSchema = z
  .enum(["passport", "medical_records", "insurance", "other"])
  .default("other");

const deletePayloadSchema = z.object({
  id: z.string().uuid(),
});

type AuthenticatedUser = User | null;

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

const resolveUserAndPatient = async (
  req: NextRequest,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
) => {
  const supabaseClient = await createSupabaseClient();

  const authHeader = req.headers.get("authorization");
  let user: AuthenticatedUser = null;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (token.length > 0) {
      const { data: tokenUser, error } =
        await supabaseAdmin.auth.getUser(token);
      if (!error && tokenUser?.user) {
        user = tokenUser.user;
      }
    }
  }

  if (!user) {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();
    user = session?.user ?? null;

    if (!user) {
      const { data } = await supabaseClient.auth.getUser();
      user = data?.user ?? null;
    }
  }

  if (!user?.id) {
    return { user: null, patient: null };
  }

  const { data: patient, error } = await supabaseAdmin
    .from("patients")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !patient?.id) {
    return { user, patient: null };
  }

  return { user, patient };
};

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const supabaseAdmin = getSupabaseAdmin();
  const { user, patient } = await resolveUserAndPatient(req, supabaseAdmin);

  if (!user?.id || !patient?.id) {
    return NextResponse.json(
      { error: "Authentication required to view documents" },
      { status: 401 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from("patient_documents")
    .select(
      "id, label, type, bucket, path, size, uploaded_at, created_at, request_id",
    )
    .eq("patient_id", patient.id)
    .order("uploaded_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: error.message ?? "Failed to load documents" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    documents: data ?? [],
  });
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { user, patient } = await resolveUserAndPatient(req, supabaseAdmin);

    if (!user?.id || !patient?.id) {
      return NextResponse.json(
        { error: "Authentication required to upload documents" },
        { status: 401 },
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const documentTypeInput = formData.get("documentType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Upload PDF, JPG, or PNG files." },
        { status: 400 },
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 10MB limit. Please compress and try again." },
        { status: 400 },
      );
    }

    const documentType = documentTypeSchema.parse(documentTypeInput ?? "other");
    const originalName = sanitizeFileName(file.name || file.type || "document");
    const extension = deriveExtension(originalName, file.type);
    const baseName = originalName.replace(/\.[^/.]+$/, "");

    const suffixParts = [
      slugify(baseName),
      slugify(patient.full_name),
      patient.id.slice(0, 8),
      randomUUID().slice(0, 8),
    ];

    const storedFileName = `${suffixParts
      .filter(Boolean)
      .join("_")}${extension ? `.${extension}` : ""}`;

    const storagePath = `consultations/${patient.id}/${storedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const uploadResult = await supabaseAdmin.storage
      .from(BUCKET_ID)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadResult.error) {
      return NextResponse.json(
        { error: uploadResult.error.message ?? "Failed to persist document" },
        { status: 500 },
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
      user_id: user.id,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("patient_documents")
      .insert(record)
      .select(
        "id, label, type, bucket, path, size, uploaded_at, created_at, request_id",
      )
      .maybeSingle();

    if (insertError || !inserted) {
      await supabaseAdmin.storage.from(BUCKET_ID).remove([storagePath]);
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to record document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ document: inserted }, { status: 201 });
  } catch (error) {
    console.error("[patient][documents][POST]", error);
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join(", ")
            : error instanceof Error
              ? error.message
              : "Unexpected error uploading document",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { user, patient } = await resolveUserAndPatient(req, supabaseAdmin);

    if (!user?.id || !patient?.id) {
      return NextResponse.json(
        { error: "Authentication required to delete documents" },
        { status: 401 },
      );
    }

    const payload = deletePayloadSchema.parse(await req.json());

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("patient_documents")
      .select("id, bucket, path, patient_id")
      .eq("id", payload.id)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json(
        { error: fetchError.message ?? "Failed to find document" },
        { status: 500 },
      );
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    if (existing.patient_id !== patient.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this document" },
        { status: 403 },
      );
    }

    if (existing.path) {
      await supabaseAdmin.storage
        .from(existing.bucket || BUCKET_ID)
        .remove([existing.path]);
    }

    const { error: deleteError } = await supabaseAdmin
      .from("patient_documents")
      .delete()
      .eq("id", payload.id);

    if (deleteError) {
      return NextResponse.json(
        { error: deleteError.message ?? "Failed to delete document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[patient][documents][DELETE]", error);
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join(", ")
            : error instanceof Error
              ? error.message
              : "Unexpected error deleting document",
      },
      { status: 500 },
    );
  }
}
