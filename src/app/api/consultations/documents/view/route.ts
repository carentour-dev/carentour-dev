import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";
import { createClient as createSupabaseClient } from "@/integrations/supabase/server";

const BUCKET_ID = "patient-documents";
const DEFAULT_EXPIRY_SECONDS = 60 * 15; // 15 minutes

const querySchema = z.object({
  bucket: z.literal(BUCKET_ID),
  path: z.string().min(1, "path is required"),
});

type AuthenticatedUser = User | null;

const moveDocumentIfNeeded = async (
  path: string,
  bucket: string,
  patientId: string,
  targetFolder: "consultations" | "start-journey" = "consultations",
) => {
  const supabaseAdmin = getSupabaseAdmin();
  const fileName = path.split("/").pop() ?? `file-${randomUUID().slice(0, 8)}`;
  const targetPrefix = `${targetFolder}/${patientId}/`;
  const targetPath = `${targetPrefix}${fileName}`;

  const moveOrCopy = async (from: string, to: string) => {
    const moveResult = await supabaseAdmin.storage.from(bucket).move(from, to);
    if (!moveResult.error) return { success: true, path: to };

    const copyResult = await supabaseAdmin.storage.from(bucket).copy(from, to);
    if (!copyResult.error) {
      await supabaseAdmin.storage.from(bucket).remove([from]);
      return { success: true, path: to };
    }

    return { success: false, path: from };
  };

  const initial = await moveOrCopy(path, targetPath);
  if (initial.success) {
    return initial.path;
  }

  const fallbackPath = `${targetPrefix}${randomUUID().slice(0, 8)}-${fileName}`;
  const fallback = await moveOrCopy(path, fallbackPath);
  return fallback.path;
};

export const GET = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    const parsed = querySchema.parse({
      bucket: searchParams.get("bucket"),
      path: searchParams.get("path"),
    });

    const supabaseClient = await createSupabaseClient();
    const supabaseAdmin = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization");
    let user: AuthenticatedUser = null;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7).trim();
      if (token.length > 0) {
        const { data: tokenUser, error: tokenError } =
          await supabaseAdmin.auth.getUser(token);
        if (!tokenError && tokenUser?.user) {
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
      return NextResponse.json(
        { error: "Authentication required to view documents" },
        { status: 401 },
      );
    }

    const { data: patient, error } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !patient?.id) {
      return NextResponse.json(
        { error: "No patient profile found for this account." },
        { status: 403 },
      );
    }

    let effectivePath = parsed.path;
    const allowedPrefixes = [
      `consultations/${patient.id}/`,
      `start-journey/${patient.id}/`,
    ];

    let hasAccess = allowedPrefixes.some((prefix) =>
      parsed.path.startsWith(prefix),
    );

    if (!hasAccess) {
      // Attempt to locate the document on a guest path and migrate it into the patient folder.
      const { data: requests } = await supabaseAdmin
        .from("contact_requests")
        .select("id, documents")
        .or(`patient_id.eq.${patient.id},user_id.eq.${user.id}`)
        .not("documents", "is", null);

      const matchedRequest = (requests ?? []).find((request) => {
        const docs = (request as { documents?: unknown }).documents;
        if (!Array.isArray(docs)) return false;
        return docs.some(
          (doc) =>
            doc &&
            typeof doc === "object" &&
            (doc as { path?: string }).path === parsed.path,
        );
      }) as
        | { id: string; documents?: Array<{ path?: string; bucket?: string }> }
        | undefined;

      if (matchedRequest?.documents) {
        const targetDoc = matchedRequest.documents.find(
          (doc) => doc?.path === parsed.path,
        );

        if (targetDoc?.path) {
          const movedPath = await moveDocumentIfNeeded(
            targetDoc.path,
            targetDoc.bucket ?? BUCKET_ID,
            patient.id,
          );
          effectivePath = movedPath;
          hasAccess = true;

          const updatedDocs = matchedRequest.documents.map((doc) => {
            if (!doc?.path || doc.path !== parsed.path) {
              return doc;
            }
            return {
              ...doc,
              path: movedPath,
              bucket: doc.bucket ?? BUCKET_ID,
            };
          });

          await supabaseAdmin
            .from("contact_requests")
            .update({ documents: updatedDocs })
            .eq("id", matchedRequest.id);
        }
      }
    }

    if (!hasAccess) {
      const { data: submissions } = await supabaseAdmin
        .from("start_journey_submissions")
        .select("id, documents")
        .or(`patient_id.eq.${patient.id},user_id.eq.${user.id}`)
        .not("documents", "is", null);

      const matchedSubmission = (submissions ?? []).find((submission) => {
        const docs = (submission as { documents?: unknown }).documents;
        if (!Array.isArray(docs)) return false;
        return docs.some(
          (doc) =>
            doc &&
            typeof doc === "object" &&
            (doc as { path?: string }).path === parsed.path,
        );
      }) as
        | {
            id: string;
            documents?: Array<{ path?: string; bucket?: string | null }>;
          }
        | undefined;

      if (matchedSubmission?.documents) {
        const targetDoc = matchedSubmission.documents.find(
          (doc) => doc?.path === parsed.path,
        );

        if (targetDoc?.path) {
          hasAccess = true;

          if (!parsed.path.startsWith(`start-journey/${patient.id}/`)) {
            const movedPath = await moveDocumentIfNeeded(
              targetDoc.path,
              targetDoc.bucket ?? BUCKET_ID,
              patient.id,
              "start-journey",
            );
            effectivePath = movedPath;

            const updatedDocs = matchedSubmission.documents.map((doc) => {
              if (!doc?.path || doc.path !== parsed.path) {
                return doc;
              }
              return {
                ...doc,
                path: movedPath,
                bucket: doc.bucket ?? BUCKET_ID,
              };
            });

            await supabaseAdmin
              .from("start_journey_submissions")
              .update({ documents: updatedDocs })
              .eq("id", matchedSubmission.id);
          }
        }
      }
    }

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You do not have access to this document." },
        { status: 403 },
      );
    }

    const { data, error: signedError } = await supabaseAdmin.storage
      .from(parsed.bucket)
      .createSignedUrl(effectivePath, DEFAULT_EXPIRY_SECONDS, {
        download: true,
      });

    if (signedError || !data?.signedUrl) {
      return NextResponse.json(
        { error: "Failed to generate download link." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      url: data.signedUrl,
      expiresIn: DEFAULT_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("[consultations][documents][view][GET]", error);
    return NextResponse.json(
      {
        error:
          error instanceof z.ZodError
            ? error.issues.map((issue) => issue.message).join(", ")
            : "Unexpected error loading document",
      },
      { status: 500 },
    );
  }
};
