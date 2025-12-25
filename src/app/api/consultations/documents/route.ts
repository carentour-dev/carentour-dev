import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
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

const deletePayloadSchema = z.object({
  path: z.string().min(1, "path is required"),
  bucket: z.literal(BUCKET_ID),
});

type AuthenticatedUser = User | null;

type PatientSummary = { id: string; full_name: string } | null;

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

  let patient: PatientSummary = null;
  if (user?.id) {
    const { data, error } = await supabaseAdmin
      .from("patients")
      .select("id, full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!error && data?.id && data?.full_name) {
      patient = data;
    }
  }

  return { user, patient };
};

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { patient } = await resolveUserAndPatient(req, supabaseAdmin);

    const formData = await req.formData();
    const file = formData.get("file");

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

    const originalName = sanitizeFileName(file.name || file.type || "document");
    const extension = deriveExtension(originalName, file.type);
    const baseName = originalName.replace(/\.[^/.]+$/, "");

    const suffixParts = [
      slugify(baseName),
      patient ? slugify(patient.full_name) : "guest",
    ];
    if (patient) {
      suffixParts.push(patient.id.slice(0, 8));
    }
    const randomSegment = randomUUID().slice(0, 8);
    suffixParts.push(randomSegment);

    const storedFileName = `${suffixParts
      .filter(Boolean)
      .join("_")}${extension ? `.${extension}` : ""}`;

    const folder = patient
      ? `consultations/${patient.id}`
      : `consultations/guest/${randomUUID().slice(0, 8)}`;
    const storagePath = `${folder}/${storedFileName}`;

    const arrayBuffer = await file.arrayBuffer();
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_ID)
      .upload(storagePath, Buffer.from(arrayBuffer), {
        contentType: file.type || "application/octet-stream",
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to persist document" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        document: {
          id: randomUUID(),
          type: "medical_records",
          originalName,
          storedName: storedFileName,
          path: data.path,
          bucket: BUCKET_ID,
          size: file.size,
          url: null,
          uploadedAt: new Date().toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[consultations][documents][POST]", error);
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
    const payload = deletePayloadSchema.parse(await req.json());
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.storage
      .from(payload.bucket)
      .remove([payload.path]);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to delete document" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[consultations][documents][DELETE]", error);
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
