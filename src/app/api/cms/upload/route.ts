import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { getSupabaseAdmin } from "@/server/supabase/adminClient";

export async function POST(req: NextRequest) {
  await requirePermission("cms.media");

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  const originalFileName =
    file.name.split("/").pop()?.split("\\").pop() ?? file.name;
  if (!originalFileName) {
    return NextResponse.json(
      { error: "file name is invalid" },
      { status: 400 },
    );
  }
  const storagePath = `cms/${originalFileName}`;

  const supabase = getSupabaseAdmin();

  const arrayBuffer = await file.arrayBuffer();
  const { data, error } = await supabase.storage
    .from("media")
    .upload(storagePath, Buffer.from(arrayBuffer), {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: publicUrl } = supabase.storage
    .from("media")
    .getPublicUrl(data.path);
  return NextResponse.json(
    { url: publicUrl.publicUrl, path: data.path },
    { status: 201 },
  );
}
