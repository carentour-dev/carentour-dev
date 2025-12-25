import { adminRoute } from "@/server/utils/adminRoute";
import { jsonResponse } from "@/server/utils/http";
import { getRouteParam } from "@/server/utils/params";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

const PERMISSIONS = {
  anyPermissions: ["operations.shared"],
} as const;

type ContactDocument = {
  id?: string;
  path?: string;
  bucket?: string;
};

const removeFromContactRequest = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  requestId: string,
  docId: string,
  path?: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("contact_requests")
    .select("documents")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to load contact request");
  }

  const documents = Array.isArray((data as { documents?: unknown })?.documents)
    ? ((data as { documents?: ContactDocument[] })
        .documents as ContactDocument[])
    : [];

  const filtered = documents.filter((doc) => {
    const matchesId = doc.id && doc.id === docId;
    const matchesPath = doc.path && doc.path === path;
    return !(matchesId || matchesPath);
  });

  await supabaseAdmin
    .from("contact_requests")
    .update({ documents: filtered })
    .eq("id", requestId);
};

const removeFromStartJourney = async (
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  requestId: string,
  docId: string,
  path?: string,
) => {
  const { data, error } = await supabaseAdmin
    .from("start_journey_submissions")
    .select("documents")
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message ?? "Failed to load Start Journey submission");
  }

  const documents = Array.isArray((data as { documents?: unknown })?.documents)
    ? ((data as { documents?: ContactDocument[] })
        .documents as ContactDocument[])
    : [];

  const filtered = documents.filter((doc) => {
    const matchesId = doc.id && doc.id === docId;
    const matchesPath = doc.path && doc.path === path;
    return !(matchesId || matchesPath);
  });

  await supabaseAdmin
    .from("start_journey_submissions")
    .update({ documents: filtered })
    .eq("id", requestId);
};

export const DELETE = adminRoute(async (req, ctx) => {
  const id = getRouteParam(ctx.params, "id");
  const supabaseAdmin = getSupabaseAdmin();

  let payload: {
    id?: string;
    bucket?: string;
    path?: string;
    request_id?: string;
    source?: string;
  } = {};

  try {
    payload = await req.json();
  } catch {
    // no body provided; fallback to path param only
  }

  const docId = payload.id ?? id;
  const bucket = payload.bucket ?? "patient-documents";
  const path = payload.path;
  const requestId = payload.request_id;
  const source = payload.source;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("patient_documents")
    .select("id, bucket, path")
    .eq("id", docId)
    .maybeSingle();

  if (!fetchError && existing?.id) {
    if (existing.path) {
      await supabaseAdmin.storage
        .from(existing.bucket || bucket)
        .remove([existing.path]);
    }

    await supabaseAdmin.from("patient_documents").delete().eq("id", docId);
    return jsonResponse({ success: true });
  }

  // fallback deletion for legacy/ingested documents
  if (path) {
    await supabaseAdmin.storage.from(bucket).remove([path]);

    if (source === "contact_request" && requestId) {
      await removeFromContactRequest(supabaseAdmin, requestId, docId, path);
    } else if (source === "start_journey" && requestId) {
      await removeFromStartJourney(supabaseAdmin, requestId, docId, path);
    }

    return jsonResponse({ success: true });
  }

  return jsonResponse({ error: "Document not found" }, 404);
}, PERMISSIONS);
