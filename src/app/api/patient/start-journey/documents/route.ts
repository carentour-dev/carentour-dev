import type { User } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";
import type { Json } from "@/integrations/supabase/types";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const BUCKET_ID = "patient-documents";

type AuthenticatedUser = User | null;

const deletePayloadSchema = z.object({
  path: z.string().min(1, "path is required"),
  bucket: z.string().min(1, "bucket is required"),
});

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

export async function DELETE(req: NextRequest) {
  try {
    const payload = deletePayloadSchema.parse(await req.json());

    const supabaseAdmin = getSupabaseAdmin();
    const { user, patient } = await resolveUserAndPatient(req, supabaseAdmin);

    if (!user?.id || !patient?.id) {
      return NextResponse.json(
        { error: "Authentication required to delete documents" },
        { status: 401 },
      );
    }

    if (payload.bucket !== BUCKET_ID) {
      return NextResponse.json(
        { error: "Bucket not permitted for deletion" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseAdmin
      .from("start_journey_submissions")
      .select("id, documents")
      .or(`patient_id.eq.${patient.id},user_id.eq.${user.id}`)
      .not("documents", "is", null);

    if (error) {
      return NextResponse.json(
        { error: error.message ?? "Failed to find documents" },
        { status: 500 },
      );
    }

    const submissions =
      (data as Array<{ id: string; documents?: unknown }>) ?? [];

    const matched = submissions.find((submission) => {
      const docs = submission.documents;
      if (!Array.isArray(docs)) return false;
      return docs.some(
        (doc) =>
          doc &&
          typeof doc === "object" &&
          (doc as { path?: string }).path === payload.path,
      );
    });

    if (!matched) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const updatedDocs = (
      Array.isArray(matched.documents)
        ? (matched.documents as Array<Record<string, unknown>>)
        : []
    ).filter((doc) => {
      if (!doc || typeof doc !== "object") return true;
      return (doc as { path?: string }).path !== payload.path;
    });

    const targetDoc = Array.isArray(matched.documents)
      ? (matched.documents as Array<Record<string, unknown>>).find((doc) => {
          if (!doc || typeof doc !== "object") return false;
          return (doc as { path?: string }).path === payload.path;
        })
      : null;
    const targetBucket =
      (targetDoc as { bucket?: string } | null)?.bucket ?? payload.bucket;

    const { error: updateError } = await supabaseAdmin
      .from("start_journey_submissions")
      .update({ documents: updatedDocs as unknown as Json })
      .eq("id", matched.id);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Failed to update submission" },
        { status: 500 },
      );
    }

    const { error: storageError } = await supabaseAdmin.storage
      .from(targetBucket || BUCKET_ID)
      .remove([payload.path]);

    if (storageError) {
      return NextResponse.json(
        { error: storageError.message ?? "Failed to delete file" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[patient][start-journey][documents][DELETE]", error);
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
