import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/server/auth/requireAdmin";
import { revalidateSeoPaths } from "@/lib/seo";

export async function POST(req: NextRequest) {
  await requirePermission("cms.write");
  const { path } = await req.json();
  if (!path || typeof path !== "string") {
    return NextResponse.json({ error: "path is required" }, { status: 400 });
  }
  try {
    revalidateSeoPaths([path]);
    return NextResponse.json({ revalidated: true, path });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to revalidate" },
      { status: 500 },
    );
  }
}
