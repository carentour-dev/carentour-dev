import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

type DeletePayload = {
  bucket?: unknown;
  path?: unknown;
};

export async function POST(req: NextRequest) {
  await requirePermission("cms.media");

  const json = (await req.json().catch(() => null)) as DeletePayload | null;

  if (
    !json ||
    typeof json.bucket !== "string" ||
    typeof json.path !== "string"
  ) {
    return NextResponse.json(
      { error: "Invalid payload. Provide both bucket and path." },
      { status: 400 },
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase.storage
    .from(json.bucket)
    .remove([json.path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } }, { status: 200 });
}
