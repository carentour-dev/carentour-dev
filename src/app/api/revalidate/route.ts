import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/server/auth/requireAdmin";

export async function POST(req: NextRequest) {
  await requirePermission("cms.write");
  const { path } = await req.json();
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }
  try {
    revalidatePath(path);
    return NextResponse.json({ revalidated: true, path });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to revalidate" },
      { status: 500 },
    );
  }
}
