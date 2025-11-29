import { NextResponse } from "next/server";

import { loadPublicNavigationLinks } from "@/server/navigation";

export async function GET() {
  const result = await loadPublicNavigationLinks();

  return NextResponse.json(
    { links: result.links, error: result.error },
    { status: result.error ? 500 : 200 },
  );
}
